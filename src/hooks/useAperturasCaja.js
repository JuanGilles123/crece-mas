import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import { getEmployeeSession } from '../utils/employeeSession';
import toast from 'react-hot-toast';

// Hook para obtener la apertura de caja activa
export const useAperturaCajaActiva = (organizationId) => {
  return useQuery({
    queryKey: ['apertura_caja_activa', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      // Usar directamente Supabase client ya que las políticas RLS permiten lectura anon/public.
      // Esto es más rápido y evita problemas con Edge Functions si el token tiene algún problema.
      const { data, error } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .is('cierre_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching apertura activa:', error);
        // Si falla por RLS (aunque las políticas dicen que no), intentar fallback con Edge Function para empleados
        const employeeSession = getEmployeeSession();
        if (employeeSession?.token) {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('employee-apertura-activa', {
            body: { token: employeeSession.token }
          });
          if (!edgeError && edgeData?.apertura) return edgeData.apertura;
        }
        return null;
      }
      return data || null;
    },
    enabled: !!organizationId,
    staleTime: 5000, // 5 segundos para que sea muy reactivo
    refetchInterval: 20000, // Refrescar cada 20 segundos
    refetchOnWindowFocus: true,
  });
};

// Hook para crear una apertura de caja
export const useCrearAperturaCaja = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, userId, montoInicial }) => {
      const employeeSession = getEmployeeSession();
      
      // Para CREAR apertura, sí usamos la Edge Function si es empleado (RLS de inserción es más estricto)
      if (employeeSession?.token) {
        const { data, error } = await supabase.functions.invoke('employee-open-caja', {
          body: { token: employeeSession.token, montoInicial }
        });
        if (error) throw new Error(error.message || 'Error al crear apertura');
        if (data?.error) throw new Error(data.error);
        return { apertura: data?.apertura, already_open: data?.already_open || false };
      }

      if (!organizationId || !userId) {
        throw new Error('Faltan datos de organización o usuario');
      }

      // Verificar si ya hay una apertura activa
      const { data: aperturaActiva, error: errorVerificacion } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .is('cierre_id', null)
        .maybeSingle();

      if (errorVerificacion) throw new Error('Error al verificar apertura existente');
      if (aperturaActiva) return { apertura: aperturaActiva, already_open: true };

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

      if (error) throw new Error(error.message || 'Error al crear apertura');
      return data;
    },
    onSuccess: (result) => {
      // Invalidar todas las consultas relacionadas
      queryClient.invalidateQueries(['apertura_caja_activa']);
      
      if (result?.already_open) {
        toast.success('Conectado a la caja abierta de la organización');
      } else {
        toast.success('Caja abierta exitosamente');
      }
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

      if (error) throw new Error('Error al cargar aperturas');
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 60000,
  });
};
