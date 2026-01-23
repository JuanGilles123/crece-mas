// 🍽️ Hook para gestionar mesas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener mesas de una organización
 */
export const useMesas = (organizationId) => {
  return useQuery({
    queryKey: ['mesas', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('activa', true)
        .order('numero', { ascending: true });

      if (error) {
        console.error('Error fetching mesas:', error);
        throw new Error('Error al cargar mesas');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para crear una nueva mesa
 */
export const useCrearMesa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, numero, capacidad, estado = 'disponible', forma = 'redonda', posicion_x = 0, posicion_y = 0, ancho = 80, alto = 80 }) => {
      const { data, error } = await supabase
        .from('mesas')
        .insert([{
          organization_id: organizationId,
          numero,
          capacidad: parseInt(capacidad) || 4,
          estado,
          forma,
          posicion_x: posicion_x || 0,
          posicion_y: posicion_y || 0,
          ancho: ancho || 80,
          alto: alto || 80,
          activa: true
        }])
        .select();

      if (error) {
        console.error('Error creating mesa:', error);
        throw new Error(error.message || 'Error al crear mesa');
      }

      return data[0];
    },
    onSuccess: (newMesa) => {
      queryClient.invalidateQueries(['mesas', newMesa.organization_id]);
      toast.success('Mesa creada correctamente');
    },
    onError: (error) => {
      console.error('Error creating mesa:', error);
      toast.error(error.message || 'Error al crear mesa');
    },
  });
};

/**
 * Hook para actualizar una mesa
 */
export const useActualizarMesa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, numero, capacidad, estado, activa, forma, posicion_x, posicion_y, ancho, alto }) => {
      const updateData = {};
      if (numero !== undefined) updateData.numero = numero;
      if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad) || 4;
      if (estado !== undefined) updateData.estado = estado;
      if (activa !== undefined) updateData.activa = activa;
      if (forma !== undefined) updateData.forma = forma;
      if (posicion_x !== undefined) updateData.posicion_x = posicion_x;
      if (posicion_y !== undefined) updateData.posicion_y = posicion_y;
      if (ancho !== undefined) updateData.ancho = ancho;
      if (alto !== undefined) updateData.alto = alto;

      const { data, error } = await supabase
        .from('mesas')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating mesa:', error);
        throw new Error(error.message || 'Error al actualizar mesa');
      }

      return data[0];
    },
    onSuccess: (updatedMesa) => {
      queryClient.invalidateQueries(['mesas', updatedMesa.organization_id]);
      toast.success('Mesa actualizada correctamente');
    },
    onError: (error) => {
      console.error('Error updating mesa:', error);
      toast.error(error.message || 'Error al actualizar mesa');
    },
  });
};

/**
 * Hook para eliminar una mesa
 */
export const useEliminarMesa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting mesa:', error);
        throw new Error(error.message || 'Error al eliminar mesa');
      }

      return { id, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries(['mesas', organizationId]);
      toast.success('Mesa eliminada correctamente');
    },
    onError: (error) => {
      console.error('Error deleting mesa:', error);
      toast.error(error.message || 'Error al eliminar mesa');
    },
  });
};

