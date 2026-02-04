import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener créditos de una organización
 */
export const useCreditos = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['creditos', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      try {
        // Primero obtener los créditos sin relaciones para asegurar que se obtengan
        let query = supabase
          .from('creditos')
          .select('*')
          .eq('organization_id', organizationId);
        
        // Aplicar filtros
        if (filters.estado) {
          if (filters.estado === 'vencido') {
            const hoy = new Date().toISOString().split('T')[0];
            query = query
              .or(`estado.eq.vencido,fecha_vencimiento.lt.${hoy}`)
              .in('estado', ['pendiente', 'parcial', 'vencido']);
          } else {
            query = query.eq('estado', filters.estado);
          }
        }
        
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id);
        }
        
        if (filters.vencidos) {
          query = query.lt('fecha_vencimiento', new Date().toISOString().split('T')[0])
                      .in('estado', ['pendiente', 'parcial', 'vencido']);
        }
        
        const { data: creditosData, error: creditosError } = await query
          .order('created_at', { ascending: false });
        
        if (creditosError) {
          console.error('Error fetching creditos:', creditosError);
          throw creditosError;
        }
        
        if (!creditosData || creditosData.length === 0) {
          return [];
        }
        
        // Obtener clientes y ventas por separado para evitar problemas con relaciones
        const clienteIds = [...new Set(creditosData.map(c => c.cliente_id).filter(Boolean))];
        const ventaIds = [...new Set(creditosData.map(c => c.venta_id).filter(Boolean))];
        
        // Cargar clientes
        let clientesMap = new Map();
        if (clienteIds.length > 0) {
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, nombre, documento, telefono, email, direccion')
            .in('id', clienteIds);
          
          if (clientesData) {
            clientesMap = new Map(clientesData.map(c => [c.id, c]));
          }
        }
        
        // Cargar ventas (incluyendo items para mostrar productos)
        let ventasMap = new Map();
        if (ventaIds.length > 0) {
          const { data: ventasData } = await supabase
            .from('ventas')
            .select('id, numero_venta, total, created_at, items')
            .in('id', ventaIds);
          
          if (ventasData) {
            ventasMap = new Map(ventasData.map(v => [v.id, v]));
          }
        }
        
        // Combinar datos
        const creditosCombinados = creditosData.map(credito => ({
          ...credito,
          cliente: credito.cliente_id ? (clientesMap.get(credito.cliente_id) || null) : null,
          venta: credito.venta_id ? (ventasMap.get(credito.venta_id) || null) : null
        }));

        if (filters.estado) {
          if (filters.estado === 'vencido') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return creditosCombinados.filter(credito => {
              const estado = (credito.estado || '').toLowerCase();
              if (estado === 'vencido' || estado === 'parcial') return true;
              if (!credito.fecha_vencimiento) return false;
              const fecha = new Date(credito.fecha_vencimiento);
              return fecha < hoy && estado === 'pendiente';
            });
          }
          return creditosCombinados.filter(
            credito => (credito.estado || '').toLowerCase() === filters.estado
          );
        }

        return creditosCombinados;
      } catch (error) {
        console.error('Error en useCreditos:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener un crédito específico
 */
export const useCredito = (creditoId) => {
  return useQuery({
    queryKey: ['credito', creditoId],
    queryFn: async () => {
      if (!creditoId) return null;
      
      const { data, error } = await supabase
        .from('creditos')
        .select(`
          *,
          cliente:clientes(id, nombre, documento, telefono, email, direccion),
          venta:ventas(id, numero_venta, total, created_at, items),
          pagos:pagos_creditos(*, user:auth.users(id, email))
        `)
        .eq('id', creditoId)
        .single();
      
      if (error) {
        console.error('Error fetching credito:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!creditoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

/**
 * Hook para crear un crédito
 */
export const useCrearCredito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creditoData) => {
      const { data, error } = await supabase
        .from('creditos')
        .insert([creditoData])
        .select(`
          *,
          cliente:clientes(id, nombre, documento, telefono, email, direccion)
        `)
        .single();

      if (error) {
        console.error('Error creating credito:', error);
        throw new Error(error.message || 'Error al crear crédito');
      }

      return data;
    },
    onSuccess: (newCredito) => {
      queryClient.invalidateQueries(['creditos', newCredito.organization_id]);
      queryClient.invalidateQueries(['credito', newCredito.id]);
      toast.success('Crédito creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating credito:', error);
      toast.error(error.message || 'Error al crear crédito');
    },
  });
};

/**
 * Hook para actualizar un crédito
 */
export const useActualizarCredito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('creditos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating credito:', error);
        throw new Error(error.message || 'Error al actualizar crédito');
      }

      return data;
    },
    onSuccess: (updatedCredito) => {
      queryClient.invalidateQueries(['creditos', updatedCredito.organization_id]);
      queryClient.invalidateQueries(['credito', updatedCredito.id]);
      toast.success('Crédito actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating credito:', error);
      toast.error(error.message || 'Error al actualizar crédito');
    },
  });
};

/**
 * Hook para crear un pago de crédito
 */
export const useCrearPagoCredito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pagoData) => {
      const { data, error } = await supabase
        .from('pagos_creditos')
        .insert([pagoData])
        .select(`
          *,
          credito:creditos(id, monto_total, monto_pagado, monto_pendiente, estado)
        `)
        .single();

      if (error) {
        console.error('Error creating pago credito:', error);
        throw new Error(error.message || 'Error al registrar pago');
      }

      return data;
    },
    onSuccess: (newPago) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['creditos']);
      queryClient.invalidateQueries(['credito', newPago.credito_id]);
      queryClient.invalidateQueries(['pagos_creditos']);
      toast.success('Pago registrado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating pago credito:', error);
      toast.error(error.message || 'Error al registrar pago');
    },
  });
};

/**
 * Hook para obtener pagos de un crédito
 */
export const usePagosCredito = (creditoId) => {
  return useQuery({
    queryKey: ['pagos_creditos', creditoId],
    queryFn: async () => {
      if (!creditoId) {
        console.log('usePagosCredito: No hay creditoId');
        return [];
      }
      
      console.log('usePagosCredito: Buscando pagos para credito_id:', creditoId);
      
      // Primero intentar sin la relación con auth.users para evitar problemas
      const { data, error } = await supabase
        .from('pagos_creditos')
        .select('*')
        .eq('credito_id', creditoId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching pagos credito:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('usePagosCredito: Pagos encontrados:', data?.length || 0, data);
      
      return data || [];
    },
    enabled: !!creditoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchOnWindowFocus: true, // Refrescar cuando se enfoca la ventana
    refetchOnMount: 'always'
  });
};

/**
 * Hook para eliminar un pago de crédito
 */
export const useEliminarPagoCredito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, creditoId, organizationId }) => {
      const { error } = await supabase
        .from('pagos_creditos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pago credito:', error);
        throw new Error(error.message || 'Error al eliminar pago');
      }

      return { id, creditoId, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['creditos']);
      queryClient.invalidateQueries(['credito', variables.creditoId]);
      queryClient.invalidateQueries(['pagos_creditos', variables.creditoId]);
      toast.success('Pago eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting pago credito:', error);
      toast.error(error.message || 'Error al eliminar pago');
    },
  });
};

/**
 * Hook para obtener estadísticas de créditos
 */
export const useEstadisticasCreditos = (organizationId) => {
  return useQuery({
    queryKey: ['estadisticas_creditos', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      try {
        const { data: creditos, error } = await supabase
          .from('creditos')
          .select('monto_total, monto_pagado, monto_pendiente, estado, fecha_vencimiento')
          .eq('organization_id', organizationId);
        
        if (error) {
          throw error;
        }
        
        const totalPendiente = creditos
          .filter(c => c.estado !== 'pagado' && c.estado !== 'cancelado')
          .reduce((sum, c) => sum + parseFloat(c.monto_pendiente || 0), 0);
        
        const totalPagado = creditos
          .filter(c => c.estado === 'pagado')
          .reduce((sum, c) => sum + parseFloat(c.monto_total || 0), 0);
        
        const vencidos = creditos.filter(c => {
          if (!c.fecha_vencimiento) return false;
          const fechaVenc = new Date(c.fecha_vencimiento);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          return fechaVenc < hoy && c.estado !== 'pagado' && c.estado !== 'cancelado';
        });
        
        const totalVencido = vencidos.reduce((sum, c) => sum + parseFloat(c.monto_pendiente || 0), 0);
        
        return {
          totalCreditos: creditos.length,
          totalPendiente,
          totalPagado,
          creditosVencidos: vencidos.length,
          totalVencido,
          creditosPendientes: creditos.filter(c => c.estado === 'pendiente').length,
          creditosParciales: creditos.filter(c => c.estado === 'parcial').length,
        };
      } catch (error) {
        console.error('Error en useEstadisticasCreditos:', error);
        return null;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
