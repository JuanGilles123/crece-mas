import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener productos (versión simple sin paginación)
export const useProductos = (organizationId) => {
  return useQuery({
    queryKey: ['productos', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('🔍 Consultando productos para organization_id:', organizationId);
      
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching productos:', error);
        throw new Error('Error al cargar productos');
      }

      console.log('✅ Productos cargados:', data?.length || 0);
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener productos con paginación infinita
export const useProductosPaginados = (organizationId, pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ['productos-paginados', organizationId, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { data: [], hasMore: false };
      
      console.log(`🔍 Cargando productos página ${pageParam}, organization_id:`, organizationId);
      
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

      const hasMore = (start + data.length) < count;
      
      console.log(`✅ Cargados ${data.length} productos (${start + 1}-${start + data.length} de ${count})`);
      
      return {
        data: data || [],
        nextPage: hasMore ? pageParam + 1 : undefined,
        hasMore
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!organizationId,
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
