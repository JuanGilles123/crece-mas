import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener ventas
export const useVentas = (organizationId, limit = 100) => {
  return useQuery({
    queryKey: ['ventas', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) return [];
      
      try {
        // Select todos los campos necesarios (usuario_nombre puede no existir)
        const { data, error } = await supabase
          .from('ventas')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching ventas:', error);
          throw new Error('Error al cargar ventas');
        }
        
        return data || [];
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
