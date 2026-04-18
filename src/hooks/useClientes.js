import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';
import { cacheClientes, getCachedClientes, enqueueClienteCreate, enqueueClienteUpdate, enqueueClienteDelete } from '../utils/offlineQueue';

/**
 * Hook para obtener clientes de una organización
 */
export const useClientes = (organizationId) => {
  return useQuery({
    queryKey: ['clientes', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await getCachedClientes(organizationId);
      }

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
      
      const clientes = data || [];
      await cacheClientes(organizationId, clientes);
      const cached = await getCachedClientes(organizationId);
      const pending = cached.filter(cliente => cliente.synced === 0);
      const mergedMap = new Map(clientes.map(cliente => [cliente.id, cliente]));
      pending.forEach(cliente => {
        mergedMap.set(cliente.id, { ...mergedMap.get(cliente.id), ...cliente });
      });
      return Array.from(mergedMap.values());
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
      const nombreTrimmed = (clienteData.nombre || '').trim();
      const nombreLowerCase = nombreTrimmed.toLowerCase();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedClientes(clienteData.organization_id);
        const existing = cached.find(c => c.activo !== false && (c.nombre || '').trim().toLowerCase() === nombreLowerCase);
        if (existing) {
          throw new Error(`Ya existe un cliente con el nombre "${existing.nombre}"`);
        }
        return await enqueueClienteCreate(clienteData);
      }

      // Check online
      const { data: existingClientes, error: checkError } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('organization_id', clienteData.organization_id)
        .ilike('nombre', nombreTrimmed)
        .eq('activo', true)
        .limit(1);

      if (!checkError && existingClientes && existingClientes.length > 0) {
         throw new Error(`Ya existe un cliente con el nombre "${existingClientes[0].nombre}"`);
      }

      // Clean up empty strings to avoid unique constraint violations
      const dataToInsert = { ...clienteData };
      ['documento', 'email', 'telefono'].forEach(field => {
        if (dataToInsert[field] !== undefined && dataToInsert[field] !== null && dataToInsert[field].trim() === '') {
          dataToInsert[field] = null;
        }
      });

      const { data, error } = await supabase
        .from('clientes')
        .insert([dataToInsert])
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
      if (newCliente?.synced === 0) {
        queryClient.setQueryData(['clientes', newCliente.organization_id], (old = []) => {
          return [...old, newCliente];
        });
        toast.success('Cliente guardado localmente. Se sincronizará al reconectar.');
        return;
      }
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
      const nombreTrimmed = (updates.nombre || '').trim();
      const nombreLowerCase = nombreTrimmed.toLowerCase();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedClientes(updates.organization_id);
        const existing = cached.find(c => c.id !== id && c.activo !== false && (c.nombre || '').trim().toLowerCase() === nombreLowerCase);
        if (existing) {
          throw new Error(`Ya existe otro cliente con el nombre "${existing.nombre}"`);
        }
        return await enqueueClienteUpdate({ id, updates, organizationId: updates.organization_id });
      }

      // Check online
      const { data: existingClientes, error: checkError } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('organization_id', updates.organization_id)
        .ilike('nombre', nombreTrimmed)
        .eq('activo', true)
        .neq('id', id)
        .limit(1);

      if (!checkError && existingClientes && existingClientes.length > 0) {
        throw new Error(`Ya existe otro cliente con el nombre "${existingClientes[0].nombre}"`);
      }

      // Clean up empty strings to avoid unique constraint violations
      const dataToUpdate = { ...updates, updated_at: new Date().toISOString() };
      ['documento', 'email', 'telefono'].forEach(field => {
        if (dataToUpdate[field] !== undefined && dataToUpdate[field] !== null && dataToUpdate[field].trim() === '') {
          dataToUpdate[field] = null;
        }
      });

      const { data, error } = await supabase
        .from('clientes')
        .update(dataToUpdate)
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
      if (updatedCliente?.synced === 0) {
        queryClient.setQueryData(['clientes', updatedCliente.organization_id], (old = []) => {
          return old.map(cliente => (cliente.id === updatedCliente.id ? { ...cliente, ...updatedCliente } : cliente));
        });
        toast.success('Cliente actualizado localmente. Se sincronizará al reconectar.');
        return;
      }
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
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await enqueueClienteDelete({ id, organizationId });
      }
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
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queryClient.setQueryData(['clientes', variables.organizationId], (old = []) => {
          return old.filter(cliente => cliente.id !== variables.id);
        });
        toast.success('Cliente eliminado localmente. Se sincronizará al reconectar.');
        return;
      }
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting cliente:', error);
      toast.error(error.message || 'Error al eliminar cliente');
    },
  });
};
