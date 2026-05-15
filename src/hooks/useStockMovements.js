import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';


/**
 * Hook para obtener movimientos de stock con filtros
 */
export const useStockMovements = (filters = {}) => {
  const { organizationId, productoId, varianteId, toppingId, fechaInicio, fechaFin, tipo } = filters;

  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('movimientos_stock')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (productoId) query = query.eq('producto_id', productoId);
      if (varianteId) query = query.eq('variante_id', varianteId);
      if (toppingId) query = query.eq('topping_id', toppingId);
      if (tipo) query = query.eq('tipo', tipo);
      if (fechaInicio) query = query.gte('created_at', fechaInicio);
      if (fechaFin) query = query.lte('created_at', fechaFin);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stock movements:', error);
        throw new Error('Error al cargar movimientos de stock');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos - reduce recargas innecesarias
    cacheTime: 5 * 60 * 1000, // 5 minutos en caché
  });
};

/**
 * Hook para registrar un movimiento de stock
 */
export const useRegistrarMovimientoStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimiento) => {
      const { data, error } = await supabase
        .from('movimientos_stock')
        .insert([movimiento])
        .select();

      if (error) {
        console.error('Error registering stock movement:', error);
        throw new Error('Error al registrar movimiento de stock');
      }
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['stock-movements']);
    },
  });
};

/**
 * Función de utilidad para registrar movimientos (uso fuera de componentes React si es necesario)
 */
export const registrarMovimientoStock = async (supabase, movimiento) => {
  try {
    const { error } = await supabase
      .from('movimientos_stock')
      .insert([movimiento]);

    if (error) {
      console.error('Error in registrarMovimientoStock utility:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Exception in registrarMovimientoStock:', err);
    return { success: false, error: err };
  }
};
