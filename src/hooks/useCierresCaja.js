import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

// Hook para obtener cierres de caja
export const useCierresCaja = (organizationId, limit = 100) => {
  return useQuery({
    queryKey: ['cierres_caja', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching cierres_caja:', error);
        throw new Error('Error al cargar cierres de caja');
      }
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// Hook para obtener un cierre de caja específico
export const useCierreCaja = (cierreId) => {
  return useQuery({
    queryKey: ['cierres_caja', cierreId],
    queryFn: async () => {
      if (!cierreId) return null;
      
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .eq('id', cierreId)
        .single();

      if (error) {
        console.error('Error fetching cierre_caja:', error);
        throw new Error('Error al cargar el cierre de caja');
      }
      return data;
    },
    enabled: !!cierreId,
  });
};

