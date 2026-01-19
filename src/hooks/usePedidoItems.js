// 🍽️ Hook para gestionar items de pedidos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener items de un pedido
 */
export const usePedidoItems = (pedidoId) => {
  return useQuery({
    queryKey: ['pedido-items', pedidoId],
    queryFn: async () => {
      if (!pedidoId) return [];

      const { data, error } = await supabase
        .from('pedido_items')
        .select(`
          *,
          producto:productos(id, nombre, precio_venta, imagen, tipo)
        `)
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pedido items:', error);
        throw new Error('Error al cargar items del pedido');
      }
      return data || [];
    },
    enabled: !!pedidoId,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para agregar un item a un pedido
 */
export const useAgregarPedidoItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoId, productoId, cantidad, precioUnitario, toppings, notas }) => {
      const precioTotal = precioUnitario * cantidad;

      const { data, error } = await supabase
        .from('pedido_items')
        .insert([{
          pedido_id: pedidoId,
          producto_id: productoId,
          cantidad,
          precio_unitario: precioUnitario,
          precio_total: precioTotal,
          toppings: toppings || [],
          notas_item: notas || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding pedido item:', error);
        throw new Error(error.message || 'Error al agregar item');
      }

      // Actualizar total del pedido
      const { data: items } = await supabase
        .from('pedido_items')
        .select('precio_total')
        .eq('pedido_id', pedidoId);

      const nuevoTotal = items?.reduce((sum, item) => sum + (item.precio_total || 0), 0) || 0;

      await supabase
        .from('pedidos')
        .update({ total: nuevoTotal })
        .eq('id', pedidoId);

      return data;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries(['pedido-items', newItem.pedido_id]);
      queryClient.invalidateQueries(['pedidos']);
    },
    onError: (error) => {
      console.error('Error adding pedido item:', error);
      toast.error(error.message || 'Error al agregar item');
    },
  });
};

/**
 * Hook para actualizar un item de pedido
 */
export const useActualizarPedidoItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pedidoId, cantidad, precioUnitario, toppings, notas }) => {
      const precioTotal = precioUnitario * cantidad;

      const { data, error } = await supabase
        .from('pedido_items')
        .update({
          cantidad,
          precio_unitario: precioUnitario,
          precio_total: precioTotal,
          toppings: toppings || [],
          notas_item: notas || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pedido item:', error);
        throw new Error(error.message || 'Error al actualizar item');
      }

      // Actualizar total del pedido
      const { data: items } = await supabase
        .from('pedido_items')
        .select('precio_total')
        .eq('pedido_id', pedidoId);

      const nuevoTotal = items?.reduce((sum, item) => sum + (item.precio_total || 0), 0) || 0;

      await supabase
        .from('pedidos')
        .update({ total: nuevoTotal })
        .eq('id', pedidoId);

      return data;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries(['pedido-items', updatedItem.pedido_id]);
      queryClient.invalidateQueries(['pedidos']);
    },
    onError: (error) => {
      console.error('Error updating pedido item:', error);
      toast.error(error.message || 'Error al actualizar item');
    },
  });
};

/**
 * Hook para eliminar un item de pedido
 */
export const useEliminarPedidoItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pedidoId }) => {
      const { error } = await supabase
        .from('pedido_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pedido item:', error);
        throw new Error(error.message || 'Error al eliminar item');
      }

      // Actualizar total del pedido
      const { data: items } = await supabase
        .from('pedido_items')
        .select('precio_total')
        .eq('pedido_id', pedidoId);

      const nuevoTotal = items?.reduce((sum, item) => sum + (item.precio_total || 0), 0) || 0;

      await supabase
        .from('pedidos')
        .update({ total: nuevoTotal })
        .eq('id', pedidoId);

      return { id, pedidoId };
    },
    onSuccess: ({ pedidoId }) => {
      queryClient.invalidateQueries(['pedido-items', pedidoId]);
      queryClient.invalidateQueries(['pedidos']);
    },
    onError: (error) => {
      console.error('Error deleting pedido item:', error);
      toast.error(error.message || 'Error al eliminar item');
    },
  });
};

