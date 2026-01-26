// 🎯 Hook para gestionar variaciones centralizadas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener variaciones de una organización
 */
export const useVariaciones = (organizationId) => {
  return useQuery({
    queryKey: ['variaciones', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('variaciones')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching variaciones:', error);
        throw new Error('Error al cargar variaciones');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook para crear una nueva variación
 */
export const useCrearVariacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, nombre, tipo, requerido, seleccion_multiple, max_selecciones, opciones }) => {
      const variacionData = {
        organization_id: organizationId,
        nombre,
        tipo: tipo || 'select',
        requerido: requerido || false,
        seleccion_multiple: tipo === 'select' ? (seleccion_multiple || false) : false,
        max_selecciones: tipo === 'select' && seleccion_multiple ? max_selecciones : null,
        opciones: opciones || [],
        activo: true
      };

      const { data, error } = await supabase
        .from('variaciones')
        .insert([variacionData])
        .select();

      if (error) {
        console.error('Error creating variacion:', error);
        throw new Error('Error al crear variación');
      }

      return data[0];
    },
    onSuccess: (newVariacion) => {
      queryClient.invalidateQueries(['variaciones', newVariacion.organization_id]);
      toast.success('Variación creada correctamente');
    },
    onError: (error) => {
      console.error('Error creating variacion:', error);
      toast.error(error.message || 'Error al crear variación');
    },
  });
};

/**
 * Hook para actualizar una variación
 */
export const useActualizarVariacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId, nombre, tipo, requerido, seleccion_multiple, max_selecciones, opciones, activo }) => {
      const updateData = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (requerido !== undefined) updateData.requerido = requerido;
      if (seleccion_multiple !== undefined) updateData.seleccion_multiple = seleccion_multiple;
      if (max_selecciones !== undefined) updateData.max_selecciones = max_selecciones;
      if (opciones !== undefined) updateData.opciones = opciones;
      if (activo !== undefined) updateData.activo = activo;
      // Solo actualizar updated_at si la columna existe (se maneja automáticamente por triggers en algunas tablas)

      const { data, error } = await supabase
        .from('variaciones')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating variacion:', error);
        console.error('Error details:', { id, updateData, errorMessage: error.message, errorCode: error.code });
        throw new Error(error.message || 'Error al actualizar variación');
      }

      return data[0];
    },
    onSuccess: (updatedVariacion) => {
      queryClient.invalidateQueries(['variaciones', updatedVariacion.organization_id]);
      toast.success('Variación actualizada correctamente');
    },
    onError: (error) => {
      console.error('Error updating variacion:', error);
      toast.error(error.message || 'Error al actualizar variación');
    },
  });
};

/**
 * Hook para eliminar una variación
 */
export const useEliminarVariacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      // En lugar de eliminar, marcamos como inactivo
      const { data, error } = await supabase
        .from('variaciones')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error deleting variacion:', error);
        throw new Error('Error al eliminar variación');
      }

      return data[0];
    },
    onSuccess: (deletedVariacion) => {
      queryClient.invalidateQueries(['variaciones', deletedVariacion.organization_id]);
      toast.success('Variación eliminada correctamente');
    },
    onError: (error) => {
      console.error('Error deleting variacion:', error);
      toast.error(error.message || 'Error al eliminar variación');
    },
  });
};
