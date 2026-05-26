import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';
import { enqueueVenta, cacheVentas, getCachedVentas, getPendingVentas } from '../utils/offlineQueue';

// Hook para obtener ventas
export const useVentas = (organizationId, limit = 100, historyDays = null, employeeId = null, includeCotizaciones = false) => {
  return useQuery({
    queryKey: ['ventas', organizationId, limit, historyDays, employeeId, includeCotizaciones],
    queryFn: async () => {
      if (!organizationId) return [];
      const applyFilters = (ventas = []) => {
        let filtradas = ventas;
        if (historyDays !== null && historyDays !== undefined) {
          const fechaLimite = new Date();
          fechaLimite.setDate(fechaLimite.getDate() - historyDays);
          filtradas = filtradas.filter(venta => {
            const fecha = new Date(venta.created_at || venta.fecha);
            return fecha >= fechaLimite;
          });
        }
        return filtradas
          .sort((a, b) => new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime())
          .slice(0, limit);
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedVentas(organizationId);
        const pending = await getPendingVentas({ organizationId });
        const merged = [...cached, ...pending.map(v => ({ ...v, id: v.id || v.temp_id }))];
        
        let result = merged;
        if (!includeCotizaciones) {
          result = merged.filter(v => 
            (v.metodo_pago || '').toUpperCase() !== 'COTIZACION' && 
            (v.estado || '').toLowerCase() !== 'cotizacion'
          );
        }
        
        return applyFilters(result);
      }

      try {
        let ventasData = [];
        let hasMore = true;
        let from = 0;
        const pageSize = 1000; // Límite máximo de la API de Supabase

        while (hasMore && ventasData.length < limit) {
          const to = from + pageSize - 1;
          
          // Construir query base para la página actual
          let query = supabase
            .from('ventas')
            .select('*')
            .eq('organization_id', organizationId);

          if (!includeCotizaciones) {
            query = query.neq('metodo_pago', 'COTIZACION');
          }

          if (employeeId) {
            query = query.eq('employee_id', employeeId);
          }

          if (historyDays !== null && historyDays !== undefined) {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - historyDays);
            query = query.gte('created_at', fechaLimite.toISOString());
          }

          // Aplicar orden y rango para paginación
          const { data, error: ventasError } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

          if (ventasError) {
            console.error('Error fetching ventas:', ventasError);
            throw new Error('Error al cargar ventas');
          }

          if (data && data.length > 0) {
            ventasData = [...ventasData, ...data];
            from += pageSize;
            // Si trajimos menos del tamaño de página, ya no hay más registros
            if (data.length < pageSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        // Asegurar que no excedemos el límite solicitado
        ventasData = ventasData.slice(0, limit);

        if (!ventasData || ventasData.length === 0) {
          return [];
        }

        // Cargar clientes y vendedores para las ventas
        const clienteIds = [...new Set(ventasData.map(v => v.cliente_id).filter(Boolean))];
        const employeeIds = [...new Set(ventasData.map(v => v.employee_id).filter(Boolean))];
        const userIds = [...new Set(ventasData.map(v => v.user_id).filter(Boolean))];
        
        let clientesMap = new Map();
        let vendedoresMap = new Map();
        let userProfilesMap = new Map();

        if (clienteIds.length > 0) {
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, nombre, documento, telefono, email, direccion')
            .in('id', clienteIds);
          clientesMap = new Map((clientesData || []).map(c => [c.id, c]));
        }

        if (employeeIds.length > 0) {
          const { data: vendedoresData } = await supabase
            .from('team_members')
            .select('id, employee_name')
            .in('id', employeeIds);
          vendedoresMap = new Map(
            (vendedoresData || []).map(v => [v.id, v])
          );
        }

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          userProfilesMap = new Map(
            (profilesData || []).map(p => [p.user_id, p])
          );
        }

        const ventasProcesadas = ventasData.map(venta => {
          let vendedorObj = null;
          if (venta.employee_id) {
            vendedorObj = vendedoresMap.get(venta.employee_id) || null;
          }
          if (!vendedorObj?.employee_name && venta.user_id) {
            const profile = userProfilesMap.get(venta.user_id);
            if (profile?.full_name) {
              vendedorObj = { id: venta.user_id, employee_name: profile.full_name };
            }
          }
          
          return {
            ...venta,
            cliente: venta.cliente_id ? (clientesMap.get(venta.cliente_id) || null) : null,
            vendedor: vendedorObj
          };
        });

        await cacheVentas(organizationId, ventasProcesadas);
        const pending = await getPendingVentas({ organizationId });
        return applyFilters([...ventasProcesadas, ...pending]);
      } catch (error) {
        console.error('Error en useVentas:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

// Hook para crear venta
export const useCrearVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ventaData) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const tempId = await enqueueVenta({
          ventaData: {
            ...ventaData,
            created_at: ventaData.created_at || ventaData.fecha || new Date().toISOString()
          },
          actorUserId: ventaData.user_id,
          actorEmployeeId: ventaData.employee_id || null
        });
        return { ...ventaData, id: tempId };
      }
      const { data, error } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select();

      if (error) {
        console.error('Error creating venta:', error);
        throw new Error('Error al crear venta');
      }

      return data[0];
    },
    onSuccess: (newVenta) => {
      // Invalidar y refetch ventas usando organization_id
      queryClient.invalidateQueries(['ventas', newVenta.organization_id]);
      // También invalidar productos para actualizar stock
      queryClient.invalidateQueries(['productos', newVenta.organization_id]);
    },
    onError: (error) => {
      console.error('Error creating venta:', error);
      toast.error('Error al procesar la venta');
    },
  });
};

// Hook para actualizar stock de productos
export const useActualizarStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoStock }) => {
      const { data, error } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating stock:', error);
        throw new Error('Error al actualizar stock');
      }

      return data[0];
    },
    onSuccess: (updatedProducto) => {
      // Invalidar y refetch productos usando organization_id
      queryClient.invalidateQueries(['productos', updatedProducto.organization_id]);
    },
    onError: (error) => {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
    },
  });
};
