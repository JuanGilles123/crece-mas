import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';
import { getCachedVentas } from '../utils/offlineQueue';
import { getEmployeeSession } from '../utils/employeeSession';

// Hook para obtener cotizaciones pendientes
export const useCotizaciones = (organizationId) => {
  return useQuery({
    queryKey: ['cotizaciones', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedVentas(organizationId);
        return (cached || []).filter(venta => {
          const metodo = (venta.metodo_pago || '').toUpperCase();
          const estado = (venta.estado || '').toLowerCase();
          return metodo === 'COTIZACION' || estado === 'cotizacion';
        });
      }
      
      try {
        // Función auxiliar para cargar clientes
        const cargarClientes = async (ventas) => {
          const ventasConCliente = ventas.filter(v => v.cliente_id);
          if (ventasConCliente.length === 0) {
            return ventas.map(v => ({ ...v, cliente: null }));
          }
          
          const clienteIds = [...new Set(ventasConCliente.map(v => v.cliente_id).filter(Boolean))];
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, nombre, documento, telefono, email, direccion')
            .in('id', clienteIds);
          
          const clientesMap = new Map((clientesData || []).map(c => [c.id, c]));
          return ventas.map(venta => ({
            ...venta,
            cliente: venta.cliente_id ? (clientesMap.get(venta.cliente_id) || null) : null
          }));
        };
        
        // Intentar obtener cotizaciones por ambos criterios para mayor compatibilidad
        const [resEstado, resMetodo] = await Promise.all([
          supabase
            .from('ventas')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('estado', 'cotizacion')
            .order('created_at', { ascending: false }),
          supabase
            .from('ventas')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('metodo_pago', 'COTIZACION')
            .order('created_at', { ascending: false })
        ]);

        // Combinar resultados y eliminar duplicados por ID
        const ventasCombinadas = [...(resEstado.data || []), ...(resMetodo.data || [])];
        const uniqueVentas = Array.from(new Map(ventasCombinadas.map(v => [v.id, v])).values());

        // Si ambas fallaron por falta de columna, el error se manejará en el catch o aquí
        if (resEstado.error && resMetodo.error) {
          console.error('Error fetching cotizaciones:', resEstado.error, resMetodo.error);
          return [];
        }

        return await cargarClientes(uniqueVentas.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      } catch (error) {
        console.error('Error en useCotizaciones:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para guardar cotización
export const useGuardarCotizacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cotizacionData) => {
      // Determinar IDs de actor (usuario o empleado)
      // Priorizar los que vienen en cotizacionData, si no, buscar sesión
      const employeeSession = getEmployeeSession();
      const finalEmployeeId = cotizacionData.employee_id || (cotizacionData.user_id ? null : (employeeSession?.employee?.id || null));
      const finalUserId = cotizacionData.user_id || (finalEmployeeId ? null : null); // Si hay empleado, user_id suele ser null en ventas
      
      // Construir objeto con solo campos básicos que sabemos que existen
      const dataToInsert = {
        organization_id: cotizacionData.organization_id,
        user_id: finalUserId,
        employee_id: finalEmployeeId,
        total: cotizacionData.total,
        metodo_pago: cotizacionData.metodo_pago || 'COTIZACION', // Valor especial para cotizaciones (metodo_pago tiene NOT NULL)
        items: cotizacionData.items,
        fecha: cotizacionData.fecha || new Date().toISOString(),
        cliente_id: cotizacionData.cliente_id || null,
        numero_venta: cotizacionData.numero_venta || null
      };

      // Intentar insertar primero solo con campos básicos
      let { data, error } = await supabase
        .from('ventas')
        .insert([dataToInsert])
        .select();

      // Si hay error por campos faltantes, intentar sin los campos opcionales
      if (error && error.code === 'PGRST204') {
        // El error ya indica que algunos campos no existen, así que solo usamos los básicos
        console.warn('Algunos campos opcionales no existen en la tabla, guardando solo con campos básicos');
        
        // Reintentar solo con campos básicos (ya los tenemos en dataToInsert)
        const retryResult = await supabase
          .from('ventas')
          .insert([dataToInsert])
          .select();
        
        if (retryResult.error) {
          console.error('Error creating cotizacion (solo campos básicos):', retryResult.error);
          throw new Error(`Error al guardar cotización: ${retryResult.error.message}. Nota: Algunos campos opcionales (estado, subtotal, impuestos, etc.) no existen en la tabla. La cotización se guardará con campos básicos. Para funcionalidad completa, ejecuta el script SQL en docs/ADD_COTIZACIONES_FIELD.sql`);
        }
        
        data = retryResult.data;
        error = retryResult.error;
      } else if (error) {
        console.error('Error creating cotizacion:', error);
        throw new Error(`Error al guardar cotización: ${error.message}`);
      }

      return data && data.length > 0 ? data[0] : cotizacionData;
    },
    onSuccess: (newCotizacion, variables) => {
      // Invalidar y refetch cotizaciones
      const orgId = newCotizacion?.organization_id || variables?.organization_id;
      if (orgId) {
        queryClient.invalidateQueries(['cotizaciones', orgId]);
        // También invalidar ventas para que aparezca en el historial
        queryClient.invalidateQueries(['ventas', orgId]);
      }
      toast.success('Cotización guardada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating cotizacion:', error);
      toast.error('Error al guardar la cotización');
    },
  });
};

// Hook para actualizar cotización (convertir a venta o actualizar)
export const useActualizarCotizacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('ventas')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating cotizacion:', error);
        throw new Error('Error al actualizar cotización');
      }

      return data ? data[0] : null;
    },
    onSuccess: (updatedCotizacion, variables) => {
      // Invalidar queries
      const orgId = updatedCotizacion?.organization_id || variables.updates?.organization_id;
      if (orgId) {
        queryClient.invalidateQueries(['cotizaciones', orgId]);
        queryClient.invalidateQueries(['ventas', orgId]);
      }
    },
    onError: (error) => {
      console.error('Error updating cotizacion:', error);
      toast.error('Error al actualizar la cotización');
    },
  });
};

// Hook para eliminar cotización
export const useEliminarCotizacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      // Intentar eliminar la cotización. 
      // Usamos el ID directamente ya que es la forma más segura si ya sabemos que es una cotización.
      // Pero para mayor seguridad, intentamos verificar que sea una cotización.
      
      const { error: deleteError } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id)
        .or('metodo_pago.eq.COTIZACION,estado.eq.cotizacion');

      if (deleteError) {
        console.error('Error deleting cotizacion (attempt 1):', deleteError);
        
        // Si falla por la columna 'estado', intentar solo con 'metodo_pago'
        if (deleteError.message?.includes('estado')) {
          const { error: retryError } = await supabase
            .from('ventas')
            .delete()
            .eq('id', id)
            .eq('metodo_pago', 'COTIZACION');
          
          if (retryError) {
            console.error('Error deleting cotizacion (retry):', retryError);
            throw new Error('Error al eliminar cotización');
          }
        } else {
          // Si es otro error, intentar borrar por ID sin filtros adicionales (último recurso)
          const { error: finalError } = await supabase
            .from('ventas')
            .delete()
            .eq('id', id);
            
          if (finalError) throw new Error('Error al eliminar cotización');
        }
      }

      return { id, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      // Invalidar queries
      queryClient.invalidateQueries(['cotizaciones', organizationId]);
      queryClient.invalidateQueries(['ventas', organizationId]);
      toast.success('Cotización eliminada');
    },
    onError: (error) => {
      console.error('Error deleting cotizacion:', error);
      toast.error('Error al eliminar la cotización');
    },
  });
};
