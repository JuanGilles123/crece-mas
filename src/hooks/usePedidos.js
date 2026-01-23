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
                  producto:productos(id, nombre, precio_venta, imagen, tipo, metadata)
                )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      // Asegurar que siempre se obtenga cliente_nombre
      // (ya está incluido en el *)

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
    mutationFn: async ({ 
      organizationId, 
      mesaId, 
      items, 
      notas, 
      meseroId,
      // Nuevos campos
      tipoPedido = 'dine_in',
      clienteNombre = null,
      clienteTelefono = null,
      direccionEntrega = null,
      costoEnvio = 0,
      horaEstimada = null,
      numeroPersonas = 1,
      prioridad = 'normal',
      pagoInmediato = false
    }) => {
      // Calcular total (incluyendo costo de envío)
      const subtotal = items.reduce((sum, item) => {
        return sum + (item.precio_total || 0);
      }, 0);
      const total = subtotal + (parseFloat(costoEnvio) || 0);

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

      // Crear pedido con todos los campos
      const pedidoData = {
        organization_id: organizationId,
        mesa_id: mesaId || null,
        numero_pedido: nuevoNumero,
        estado: 'pendiente',
        total,
        notas: notas || null,
        mesero_id: meseroId,
        tipo_pedido: tipoPedido,
        cliente_nombre: clienteNombre || null,
        cliente_telefono: clienteTelefono || null,
        direccion_entrega: direccionEntrega || null,
        costo_envio: parseFloat(costoEnvio) || 0,
        hora_estimada: horaEstimada || null,
        numero_personas: numeroPersonas || 1,
        prioridad: prioridad,
        pago_inmediato: pagoInmediato
      };

      const { data: pedidoResult, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select()
        .single();

      if (pedidoError) {
        throw new Error(pedidoError.message || 'Error al crear pedido');
      }

      // Crear items del pedido - limpiar datos para evitar errores de serialización
      const itemsData = items.map(item => {
        // Limpiar toppings: solo incluir propiedades serializables
        const toppingsLimpios = (item.toppings || []).map(t => {
          if (typeof t === 'object' && t !== null) {
            return {
              id: t.id,
              nombre: t.nombre,
              precio: t.precio,
            };
          }
          return t;
        });
        
        // Limpiar variaciones: solo incluir valores primitivos
        const variacionesLimpias = {};
        const variaciones = item.variaciones || item.variaciones_seleccionadas;
        if (variaciones && typeof variaciones === 'object' && Object.keys(variaciones).length > 0) {
          Object.keys(variaciones).forEach(key => {
            const value = variaciones[key];
            // Solo incluir valores primitivos (string, number, boolean)
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              variacionesLimpias[key] = value;
            }
          });
        }
        
        const itemData = {
          pedido_id: pedidoResult.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
          toppings: toppingsLimpios,
          notas_item: item.notas || null
        };
        
        // Solo incluir variaciones_seleccionadas si hay variaciones limpias
        if (Object.keys(variacionesLimpias).length > 0) {
          itemData.variaciones_seleccionadas = variacionesLimpias;
        }
        
        return itemData;
      });

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsData);

      if (itemsError) {
        // Si el error es porque falta la columna variaciones_seleccionadas, dar un mensaje más claro
        if (itemsError.message && itemsError.message.includes('variaciones_seleccionadas')) {
          // Eliminar pedido si falla la creación de items
          await supabase.from('pedidos').delete().eq('id', pedidoResult.id);
          throw new Error('La columna variaciones_seleccionadas no existe en la base de datos. Por favor ejecuta el script SQL: docs/ADD_VARIACIONES_TO_PEDIDO_ITEMS.sql en Supabase');
        }
        
        // Eliminar pedido si falla la creación de items
        await supabase.from('pedidos').delete().eq('id', pedidoResult.id);
        throw new Error(itemsError.message || 'Error al crear items del pedido');
      }

      // Actualizar estado de la mesa a ocupada (solo si hay mesa)
      if (mesaId) {
        await supabase
          .from('mesas')
          .update({ estado: 'ocupada' })
          .eq('id', mesaId);
      }

      return pedidoResult;
    },
    onSuccess: (newPedido) => {
      queryClient.invalidateQueries(['pedidos', newPedido.organization_id]);
      queryClient.invalidateQueries(['mesas', newPedido.organization_id]);
      toast.success('Pedido creado correctamente');
    },
    onError: (error) => {
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
      // Si el estado es "completado", obtener el mesa_id antes de actualizar para liberar la mesa
      let mesaIdParaLiberar = null;
      if (estado === 'completado') {
        const { data: pedidoActual, error: pedidoError } = await supabase
          .from('pedidos')
          .select('mesa_id')
          .eq('id', id)
          .single();
        
        if (!pedidoError && pedidoActual?.mesa_id) {
          mesaIdParaLiberar = pedidoActual.mesa_id;
        }
      }

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
        throw new Error(error.message || 'Error al actualizar pedido');
      }

      // Si el pedido se completó y tiene una mesa asociada, liberar la mesa
      if (estado === 'completado' && mesaIdParaLiberar) {
        try {
          const { error: mesaError } = await supabase
            .from('mesas')
            .update({ estado: 'disponible' })
            .eq('id', mesaIdParaLiberar);
          
          // Error silencioso para no fallar la actualización del pedido
          if (mesaError) {
            // No hacer nada
          }
        } catch (error) {
          // Error silencioso para no fallar la actualización del pedido
        }
      }

      return data;
    },
    onSuccess: (updatedPedido) => {
      queryClient.invalidateQueries(['pedidos', updatedPedido.organization_id]);
      toast.success('Pedido actualizado correctamente');
    },
    onError: (error) => {
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
      toast.error(error.message || 'Error al eliminar pedido');
    },
  });
};

