import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener productos
export const useProductos = (userId) => {
  return useQuery({
    queryKey: ['productos', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching productos:', error);
        throw new Error('Error al cargar productos');
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para agregar producto
export const useAgregarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productoData) => {
      const { data, error } = await supabase
        .from('productos')
        .insert([productoData])
        .select();

      if (error) {
        console.error('Error adding producto:', error);
        throw new Error('Error al agregar producto');
      }

      return data[0];
    },
    onSuccess: (newProducto) => {
      // Invalidar y refetch productos
      queryClient.invalidateQueries(['productos', newProducto.user_id]);
      toast.success('¡Producto agregado exitosamente!');
    },
    onError: (error) => {
      console.error('Error adding producto:', error);
      toast.error('Error al agregar producto');
    },
  });
};

// Hook para actualizar producto
export const useActualizarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating producto:', error);
        throw new Error('Error al actualizar producto');
      }

      return data[0];
    },
    onSuccess: (updatedProducto) => {
      // Invalidar y refetch productos
      queryClient.invalidateQueries(['productos', updatedProducto.user_id]);
      toast.success('¡Producto actualizado exitosamente!');
    },
    onError: (error) => {
      console.error('Error updating producto:', error);
      toast.error('Error al actualizar producto');
    },
  });
};

// Hook para eliminar producto
export const useEliminarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }) => {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting producto:', error);
        throw new Error('Error al eliminar producto');
      }

      return { id, userId };
    },
    onSuccess: ({ userId }) => {
      // Invalidar y refetch productos
      queryClient.invalidateQueries(['productos', userId]);
      toast.success('¡Producto eliminado exitosamente!');
    },
    onError: (error) => {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar producto');
    },
  });
};
