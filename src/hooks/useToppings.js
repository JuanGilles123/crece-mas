// 🍔 Hook para gestionar toppings
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener toppings de una organización
 */
export const useToppings = (organizationId) => {
  return useQuery({
    queryKey: ['toppings', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('toppings')
        .select('id, nombre, precio, stock, imagen_url, activo, created_at, updated_at, organization_id, tipo')
        .eq('organization_id', organizationId)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching toppings:', error);
        throw new Error('Error al cargar toppings');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook para crear un nuevo topping
 */
export const useCrearTopping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, nombre, precio, stock, imagen_url, tipo }) => {
      const { data, error } = await supabase
        .from('toppings')
        .insert([{
          organization_id: organizationId,
          nombre,
          precio: parseFloat(precio) || 0,
          stock: stock !== null && stock !== '' ? parseInt(stock) : null,
          activo: true,
          imagen_url: imagen_url || null,
          tipo: tipo || 'comida'
        }])
        .select();

      if (error) {
        console.error('Error creating topping:', error);
        throw new Error('Error al crear topping');
      }

      return data[0];
    },
    onSuccess: (newTopping) => {
      queryClient.invalidateQueries(['toppings', newTopping.organization_id]);
      toast.success('Topping creado correctamente');
    },
    onError: (error) => {
      console.error('Error creating topping:', error);
      toast.error('Error al crear topping');
    },
  });
};

/**
 * Hook para actualizar un topping
 */
export const useActualizarTopping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, nombre, precio, stock, activo, imagen_url, tipo }) => {
      const updateData = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (precio !== undefined) updateData.precio = parseFloat(precio) || 0;
      if (stock !== undefined) updateData.stock = stock !== null && stock !== '' ? parseInt(stock) : null;
      if (activo !== undefined) updateData.activo = activo;
      if (imagen_url !== undefined) updateData.imagen_url = imagen_url;
      if (tipo !== undefined) updateData.tipo = tipo;

      const { data, error } = await supabase
        .from('toppings')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating topping:', error);
        throw new Error('Error al actualizar topping');
      }

      return data[0];
    },
    onSuccess: (updatedTopping) => {
      queryClient.invalidateQueries(['toppings', updatedTopping.organization_id]);
      toast.success('Topping actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating topping:', error);
      toast.error('Error al actualizar topping');
    },
  });
};

/**
 * Hook para eliminar un topping
 */
export const useEliminarTopping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('toppings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting topping:', error);
        throw new Error('Error al eliminar topping');
      }

      return { id, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries(['toppings', organizationId]);
      toast.success('Topping eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting topping:', error);
      toast.error('Error al eliminar topping');
    },
  });
};

/**
 * Hook para actualizar stock de un topping
 */
export const useActualizarStockTopping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, nuevoStock }) => {
      const { data, error } = await supabase
        .from('toppings')
        .update({ stock: parseInt(nuevoStock) || 0 })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating topping stock:', error);
        throw new Error('Error al actualizar stock');
      }

      return data[0];
    },
    onSuccess: (updatedTopping) => {
      queryClient.invalidateQueries(['toppings', updatedTopping.organization_id]);
    },
    onError: (error) => {
      console.error('Error updating topping stock:', error);
      toast.error('Error al actualizar stock del topping');
    },
  });
};

