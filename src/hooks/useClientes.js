import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook para obtener clientes de una organización
 */
export const useClientes = (organizationId) => {
  return useQuery({
    queryKey: ['clientes', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching clientes:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para crear un nuevo cliente
 */
export const useCrearCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clienteData) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert([clienteData])
        .select()
        .single();

      if (error) {
        console.error('Error creating cliente:', error);
        throw new Error(error.message || 'Error al crear cliente');
      }

      return data;
    },
    onSuccess: (newCliente) => {
      queryClient.invalidateQueries(['clientes', newCliente.organization_id]);
      toast.success('Cliente creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating cliente:', error);
      toast.error(error.message || 'Error al crear cliente');
    },
  });
};

/**
 * Hook para actualizar un cliente
 */
export const useActualizarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cliente:', error);
        throw new Error(error.message || 'Error al actualizar cliente');
      }

      return data;
    },
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries(['clientes', updatedCliente.organization_id]);
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating cliente:', error);
      toast.error(error.message || 'Error al actualizar cliente');
    },
  });
};

/**
 * Hook para eliminar (desactivar) un cliente
 */
export const useEliminarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      // En lugar de eliminar, desactivamos el cliente
      const { data, error } = await supabase
        .from('clientes')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deleting cliente:', error);
        throw new Error(error.message || 'Error al eliminar cliente');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['clientes', variables.organizationId]);
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting cliente:', error);
      toast.error(error.message || 'Error al eliminar cliente');
    },
  });
};
