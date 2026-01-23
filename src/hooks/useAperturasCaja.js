import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

// Hook para obtener la apertura de caja activa
export const useAperturaCajaActiva = (organizationId) => {
  return useQuery({
    queryKey: ['apertura_caja_activa', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Buscar la última apertura que no tenga un cierre asociado
      const { data, error } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .is('cierre_id', null) // Apertura sin cierre = caja abierta
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error('Error al verificar apertura de caja');
      }
      return data || null;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
  });
};

// Hook para crear una apertura de caja
export const useCrearAperturaCaja = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, userId, montoInicial }) => {
      if (!organizationId || !userId) {
        throw new Error('Faltan datos de organización o usuario');
      }

      // Verificar si ya hay una apertura activa
      const { data: aperturaActiva, error: errorVerificacion } = await supabase
        .from('aperturas_caja')
        .select('id')
        .eq('organization_id', organizationId)
        .is('cierre_id', null)
        .maybeSingle();

      if (errorVerificacion) {
        throw new Error('Error al verificar apertura existente');
      }

      if (aperturaActiva) {
        throw new Error('Ya existe una caja abierta. Debes cerrarla antes de abrir una nueva.');
      }

      // Crear la apertura
      const { data, error } = await supabase
        .from('aperturas_caja')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          monto_inicial: parseFloat(montoInicial) || 0,
          estado: 'abierta'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Error al crear apertura de caja');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['apertura_caja_activa', data.organization_id]);
      toast.success('Caja abierta exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al abrir la caja');
    },
  });
};

// Hook para obtener historial de aperturas
export const useAperturasCaja = (organizationId, limit = 100) => {
  return useQuery({
    queryKey: ['aperturas_caja', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Error al cargar aperturas de caja');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
};
