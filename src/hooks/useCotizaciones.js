import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener cotizaciones pendientes
export const useCotizaciones = (organizationId) => {
  return useQuery({
    queryKey: ['cotizaciones', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
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
        
        // Intentar primero con el campo 'estado' si existe
        try {
          const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('estado', 'cotizacion')
            .order('created_at', { ascending: false });
          
          if (!error) {
            return await cargarClientes(data || []);
          }
          
          // Si el error es porque no existe la columna, usar método alternativo
          if (error.code === 'PGRST204' || error.message?.includes('estado')) {
            console.warn('Campo estado no existe, usando método alternativo para identificar cotizaciones');
            // Usar metodo_pago = 'COTIZACION' como indicador de cotización
            const { data: altData, error: altError } = await supabase
              .from('ventas')
              .select('*')
              .eq('organization_id', organizationId)
              .eq('metodo_pago', 'COTIZACION')
              .order('created_at', { ascending: false });
            
            if (altError) {
              console.error('Error fetching cotizaciones (alternativo):', altError);
              return [];
            }
            return await cargarClientes(altData || []);
          }
          throw error;
        } catch (err) {
          // Si el error es porque no existe la columna, usar método alternativo
          if (err.code === 'PGRST204' || err.message?.includes('estado')) {
            console.warn('Campo estado no existe, usando método alternativo para identificar cotizaciones');
            const { data: altData, error: altError } = await supabase
              .from('ventas')
              .select('*')
              .eq('organization_id', organizationId)
              .eq('metodo_pago', 'COTIZACION')
              .order('created_at', { ascending: false });
            
            if (altError) {
              console.error('Error fetching cotizaciones (alternativo):', altError);
              return [];
            }
            return await cargarClientes(altData || []);
          }
          throw err;
        }
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
      // Construir objeto con solo campos básicos que sabemos que existen
      const dataToInsert = {
        organization_id: cotizacionData.organization_id,
        user_id: cotizacionData.user_id,
        total: cotizacionData.total,
        metodo_pago: cotizacionData.metodo_pago || 'COTIZACION', // Valor especial para cotizaciones (metodo_pago tiene NOT NULL)
        items: cotizacionData.items,
        fecha: cotizacionData.fecha || new Date().toISOString()
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

      return data[0];
    },
    onSuccess: (newCotizacion) => {
      // Invalidar y refetch cotizaciones
      queryClient.invalidateQueries(['cotizaciones', newCotizacion.organization_id]);
      // También invalidar ventas para que aparezca en el historial
      queryClient.invalidateQueries(['ventas', newCotizacion.organization_id]);
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

      return data[0];
    },
    onSuccess: (updatedCotizacion) => {
      // Invalidar queries
      queryClient.invalidateQueries(['cotizaciones', updatedCotizacion.organization_id]);
      queryClient.invalidateQueries(['ventas', updatedCotizacion.organization_id]);
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
      // Intentar eliminar usando estado, si falla usar metodo_pago = null
      let { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id)
        .eq('estado', 'cotizacion');

      // Si el error es porque no existe la columna 'estado', usar método alternativo
      if (error && (error.code === 'PGRST204' || error.message?.includes('estado'))) {
        const result = await supabase
          .from('ventas')
          .delete()
          .eq('id', id)
          .eq('metodo_pago', 'COTIZACION');
        
        if (result.error) {
          console.error('Error deleting cotizacion:', result.error);
          throw new Error('Error al eliminar cotización');
        }
        error = result.error;
      } else if (error) {
        console.error('Error deleting cotizacion:', error);
        throw new Error('Error al eliminar cotización');
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
