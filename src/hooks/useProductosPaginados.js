import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener productos con paginación
export const useProductosPaginados = (userId, options = {}) => {
  const {
    pageSize = 20,
    searchTerm = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['productos-paginados', userId, pageSize, searchTerm, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { data: [], total: 0, hasMore: false };

      let query = supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar filtro de búsqueda si existe
      if (searchTerm.trim()) {
        // Buscar en campos directos y en metadata (JSON)
        // Para metadata, usamos el operador ->> para acceder a campos JSON como texto
        query = query.or(
          `nombre.ilike.%${searchTerm}%,` +
          `codigo.ilike.%${searchTerm}%,` +
          `metadata->>marca.ilike.%${searchTerm}%,` +
          `metadata->>modelo.ilike.%${searchTerm}%,` +
          `metadata->>color.ilike.%${searchTerm}%,` +
          `metadata->>talla.ilike.%${searchTerm}%,` +
          `metadata->>categoria.ilike.%${searchTerm}%,` +
          `metadata->>descripcion.ilike.%${searchTerm}%,` +
          `metadata->>material.ilike.%${searchTerm}%,` +
          `metadata->>dimensiones.ilike.%${searchTerm}%,` +
          `metadata->>duracion.ilike.%${searchTerm}%,` +
          `metadata->>ingredientes.ilike.%${searchTerm}%,` +
          `metadata->>alergenos.ilike.%${searchTerm}%`
        );
      }

      // Aplicar paginación
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .range(from, to);

      if (error) {
        console.error('Error fetching productos paginados:', error);
        throw new Error('Error al cargar productos');
      }

      const total = count || 0;
      const hasMore = (from + pageSize) < total;
      const productos = data || [];

      let productosConVariantes = productos;
      if (productos.length > 0) {
        const ids = productos.map(p => p.id);
        const { data: variantesData, error: variantesError } = await supabase
          .from('product_variants')
          .select('*')
          .in('producto_id', ids);

        if (variantesError) {
          console.error('Error fetching product variants:', variantesError);
        } else {
          const variantesMap = new Map();
          (variantesData || []).forEach(vari => {
            if (!variantesMap.has(vari.producto_id)) {
              variantesMap.set(vari.producto_id, []);
            }
            variantesMap.get(vari.producto_id).push(vari);
          });
          productosConVariantes = productos.map(producto => ({
            ...producto,
            variantes: variantesMap.get(producto.id) || []
          }));
        }
      }

      return {
        data: productosConVariantes,
        total,
        hasMore,
        currentPage: pageParam,
        totalPages: Math.ceil(total / pageSize)
      };
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true, // Mantener datos anteriores mientras carga nuevos
  });
};

// Hook para infinite scroll (carga progresiva)
export const useProductosInfinite = (userId, options = {}) => {
  const {
    pageSize = 20,
    searchTerm = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    enabled = true
  } = options;

  return useInfiniteQuery({
    queryKey: ['productos-infinite', userId, pageSize, searchTerm, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { data: [], total: 0, hasMore: false };

      let query = supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar filtro de búsqueda si existe
      if (searchTerm.trim()) {
        // Buscar en campos directos y en metadata (JSON)
        // Para metadata, usamos el operador ->> para acceder a campos JSON como texto
        query = query.or(
          `nombre.ilike.%${searchTerm}%,` +
          `codigo.ilike.%${searchTerm}%,` +
          `metadata->>marca.ilike.%${searchTerm}%,` +
          `metadata->>modelo.ilike.%${searchTerm}%,` +
          `metadata->>color.ilike.%${searchTerm}%,` +
          `metadata->>talla.ilike.%${searchTerm}%,` +
          `metadata->>categoria.ilike.%${searchTerm}%,` +
          `metadata->>descripcion.ilike.%${searchTerm}%,` +
          `metadata->>material.ilike.%${searchTerm}%,` +
          `metadata->>dimensiones.ilike.%${searchTerm}%,` +
          `metadata->>duracion.ilike.%${searchTerm}%,` +
          `metadata->>ingredientes.ilike.%${searchTerm}%,` +
          `metadata->>alergenos.ilike.%${searchTerm}%`
        );
      }

      // Aplicar paginación
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .range(from, to);

      if (error) {
        console.error('Error fetching productos infinite:', error);
        throw new Error('Error al cargar productos');
      }

      const total = count || 0;
      const hasMore = (from + pageSize) < total;
      const productos = data || [];

      let productosConVariantes = productos;
      if (productos.length > 0) {
        const ids = productos.map(p => p.id);
        const { data: variantesData, error: variantesError } = await supabase
          .from('product_variants')
          .select('*')
          .in('producto_id', ids);

        if (variantesError) {
          console.error('Error fetching product variants:', variantesError);
        } else {
          const variantesMap = new Map();
          (variantesData || []).forEach(vari => {
            if (!variantesMap.has(vari.producto_id)) {
              variantesMap.set(vari.producto_id, []);
            }
            variantesMap.get(vari.producto_id).push(vari);
          });
          productosConVariantes = productos.map(producto => ({
            ...producto,
            variantes: variantesMap.get(producto.id) || []
          }));
        }
      }

      return {
        data: productosConVariantes,
        total,
        hasMore,
        currentPage: pageParam,
        totalPages: Math.ceil(total / pageSize)
      };
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.currentPage + 1 : undefined;
    },
    keepPreviousData: true,
  });
};

// Hook para búsqueda rápida (para Caja)
export const useProductosBusqueda = (userId, searchTerm, options = {}) => {
  const {
    limit = 50,
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['productos-busqueda', userId, searchTerm, limit],
    queryFn: async () => {
      if (!userId || !searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', userId)
        .or(
          `nombre.ilike.%${searchTerm}%,` +
          `codigo.ilike.%${searchTerm}%,` +
          `metadata->>marca.ilike.%${searchTerm}%,` +
          `metadata->>modelo.ilike.%${searchTerm}%,` +
          `metadata->>color.ilike.%${searchTerm}%,` +
          `metadata->>talla.ilike.%${searchTerm}%,` +
          `metadata->>categoria.ilike.%${searchTerm}%,` +
          `metadata->>descripcion.ilike.%${searchTerm}%,` +
          `metadata->>material.ilike.%${searchTerm}%,` +
          `metadata->>dimensiones.ilike.%${searchTerm}%,` +
          `metadata->>duracion.ilike.%${searchTerm}%,` +
          `metadata->>ingredientes.ilike.%${searchTerm}%,` +
          `metadata->>alergenos.ilike.%${searchTerm}%`
        )
        .order('nombre')
        .limit(limit);

      if (error) {
        console.error('Error fetching productos busqueda:', error);
        throw new Error('Error al buscar productos');
      }

      return data || [];
    },
    enabled: enabled && !!userId && searchTerm.trim().length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener conteo total de productos
export const useProductosCount = (userId) => {
  return useQuery({
    queryKey: ['productos-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching productos count:', error);
        throw new Error('Error al contar productos');
      }

      return count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para agregar producto (optimizado)
export const useAgregarProductoOptimizado = () => {
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
      // Invalidar todas las queries relacionadas con productos
      queryClient.invalidateQueries(['productos-paginados', newProducto.user_id]);
      queryClient.invalidateQueries(['productos-infinite', newProducto.user_id]);
      queryClient.invalidateQueries(['productos-count', newProducto.user_id]);
      queryClient.invalidateQueries(['productos-busqueda', newProducto.user_id]);
      
      toast.success('¡Producto agregado exitosamente!');
    },
    onError: (error) => {
      console.error('Error adding producto:', error);
      toast.error('Error al agregar producto');
    },
  });
};

// Hook para actualizar producto (optimizado)
export const useActualizarProductoOptimizado = () => {
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
      // Invalidar todas las queries relacionadas con productos
      queryClient.invalidateQueries(['productos-paginados', updatedProducto.user_id]);
      queryClient.invalidateQueries(['productos-infinite', updatedProducto.user_id]);
      queryClient.invalidateQueries(['productos-count', updatedProducto.user_id]);
      queryClient.invalidateQueries(['productos-busqueda', updatedProducto.user_id]);
      
      toast.success('¡Producto actualizado exitosamente!');
    },
    onError: (error) => {
      console.error('Error updating producto:', error);
      toast.error('Error al actualizar producto');
    },
  });
};

// Hook para eliminar producto (optimizado)
export const useEliminarProductoOptimizado = () => {
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
      // Invalidar todas las queries relacionadas con productos
      queryClient.invalidateQueries(['productos-paginados', userId]);
      queryClient.invalidateQueries(['productos-infinite', userId]);
      queryClient.invalidateQueries(['productos-count', userId]);
      queryClient.invalidateQueries(['productos-busqueda', userId]);
      
      toast.success('¡Producto eliminado exitosamente!');
    },
    onError: (error) => {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar producto');
    },
  });
};
