import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener productos (versión simple sin paginación)
export const useProductos = (organizationId) => {
  return useQuery({
    queryKey: ['productos', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Select solo los campos necesarios para mejor performance
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock, imagen_url, categoria, codigo, organization_id, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(300); // Reducido de 500 a 300 para mejor performance

      if (error) {
        console.error('Error fetching productos:', error);
        throw new Error('Error al cargar productos');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // Aumentado a 15 minutos
    cacheTime: 60 * 60 * 1000, // Aumentado a 60 minutos
    refetchOnMount: false, // No refetch si hay cache válido
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// Hook para obtener productos con paginación infinita
export const useProductosPaginados = (organizationId, pageSize = 50) => {
  return useInfiniteQuery({
    queryKey: ['productos-paginados', organizationId, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { data: [], hasMore: false };
      const start = pageParam * pageSize;
      const end = start + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Error fetching productos:', error);
        throw new Error('Error al cargar productos');
      }

      const hasMore = count ? (start + (data?.length || 0)) < count : false;
      
      return {
        data: data || [],
        nextPage: hasMore ? pageParam + 1 : undefined,
        hasMore
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // Aumentado a 10 minutos
    cacheTime: 30 * 60 * 1000, // Aumentado a 30 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
        throw new Error(error.message || 'Error al agregar producto');
      }

      return data[0];
    },
    onSuccess: (newProducto) => {
      // Invalidar ambas versiones del cache
      queryClient.invalidateQueries(['productos', newProducto.organization_id]);
      queryClient.invalidateQueries(['productos-paginados', newProducto.organization_id]);
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
      // Invalidar ambas versiones del cache
      queryClient.invalidateQueries(['productos', updatedProducto.organization_id]);
      queryClient.invalidateQueries(['productos-paginados', updatedProducto.organization_id]);
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
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting producto:', error);
        throw new Error('Error al eliminar producto');
      }

      return { id, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      // Invalidar ambas versiones del cache
      queryClient.invalidateQueries(['productos', organizationId]);
      queryClient.invalidateQueries(['productos-paginados', organizationId]);
      toast.success('¡Producto eliminado exitosamente!');
    },
    onError: (error) => {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar producto');
    },
  });
};
