// 🍽️ Hook para gestionar pedidos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener pedidos de una organización
 */
export const usePedidos = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['pedidos', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('pedidos')
        .select(`
          *,
          mesa:mesas(numero, capacidad),
          items:pedido_items(
            *,
            producto:productos(id, nombre, precio_venta, imagen, tipo)
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters.mesa_id) {
        query = query.eq('mesa_id', filters.mesa_id);
      }
      if (filters.chef_id) {
        query = query.eq('chef_id', filters.chef_id);
      }
      if (filters.mesero_id) {
        query = query.eq('mesero_id', filters.mesero_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pedidos:', error);
        throw new Error('Error al cargar pedidos');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 10 * 1000, // 10 segundos (actualización frecuente)
    cacheTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
};

/**
 * Hook para crear un nuevo pedido
 */
export const useCrearPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, mesaId, items, notas, meseroId }) => {
      // Calcular total
      const total = items.reduce((sum, item) => {
        return sum + (item.precio_total || 0);
      }, 0);

      // Generar número de pedido
      const { data: ultimoPedido } = await supabase
        .from('pedidos')
        .select('numero_pedido')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nuevoNumero = 'PED-001';
      if (ultimoPedido?.numero_pedido) {
        const ultimoNum = parseInt(ultimoPedido.numero_pedido.replace('PED-', ''));
        nuevoNumero = `PED-${String(ultimoNum + 1).padStart(3, '0')}`;
      }

      // Crear pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([{
          organization_id: organizationId,
          mesa_id: mesaId,
          numero_pedido: nuevoNumero,
          estado: 'pendiente',
          total,
          notas: notas || null,
          mesero_id: meseroId
        }])
        .select()
        .single();

      if (pedidoError) {
        console.error('Error creating pedido:', pedidoError);
        throw new Error(pedidoError.message || 'Error al crear pedido');
      }

      // Crear items del pedido
      const itemsData = items.map(item => ({
        pedido_id: pedidoData.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        toppings: item.toppings || [],
        notas_item: item.notas || null
      }));

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsData);

      if (itemsError) {
        console.error('Error creating pedido items:', itemsError);
        // Eliminar pedido si falla la creación de items
        await supabase.from('pedidos').delete().eq('id', pedidoData.id);
        throw new Error(itemsError.message || 'Error al crear items del pedido');
      }

      // Actualizar estado de la mesa a ocupada
      if (mesaId) {
        await supabase
          .from('mesas')
          .update({ estado: 'ocupada' })
          .eq('id', mesaId);
      }

      return pedidoData;
    },
    onSuccess: (newPedido) => {
      queryClient.invalidateQueries(['pedidos', newPedido.organization_id]);
      queryClient.invalidateQueries(['mesas', newPedido.organization_id]);
      toast.success('Pedido creado correctamente');
    },
    onError: (error) => {
      console.error('Error creating pedido:', error);
      toast.error(error.message || 'Error al crear pedido');
    },
  });
};

/**
 * Hook para actualizar un pedido
 */
export const useActualizarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, estado, chefId, notas, total }) => {
      const updateData = {};
      if (estado !== undefined) updateData.estado = estado;
      if (chefId !== undefined) updateData.chef_id = chefId;
      if (notas !== undefined) updateData.notas = notas;
      if (total !== undefined) updateData.total = total;
      if (estado === 'completado') {
        updateData.completado_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pedido:', error);
        throw new Error(error.message || 'Error al actualizar pedido');
      }

      return data;
    },
    onSuccess: (updatedPedido) => {
      queryClient.invalidateQueries(['pedidos', updatedPedido.organization_id]);
      toast.success('Pedido actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating pedido:', error);
      toast.error(error.message || 'Error al actualizar pedido');
    },
  });
};

/**
 * Hook para eliminar un pedido
 */
export const useEliminarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, mesaId }) => {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pedido:', error);
        throw new Error(error.message || 'Error al eliminar pedido');
      }

      // Liberar mesa si existe
      if (mesaId) {
        await supabase
          .from('mesas')
          .update({ estado: 'disponible' })
          .eq('id', mesaId);
      }

      return { id, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries(['pedidos', organizationId]);
      queryClient.invalidateQueries(['mesas', organizationId]);
      toast.success('Pedido eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting pedido:', error);
      toast.error(error.message || 'Error al eliminar pedido');
    },
  });
};

