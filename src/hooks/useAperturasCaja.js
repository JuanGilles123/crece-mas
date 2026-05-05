import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import { getEmployeeSession } from '../utils/employeeSession';
import toast from 'react-hot-toast';

// Hook para obtener la apertura de caja activa del usuario actual
export const useAperturaCajaActiva = (organizationId, userId) => {
  return useQuery({
    queryKey: ['apertura_caja_activa', organizationId, userId],
    queryFn: async () => {
      if (!organizationId || !userId) return null;

      const employeeSession = getEmployeeSession();
      let apertura = null;

      if (employeeSession?.token) {
        const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const { data, error } = await supabase.functions.invoke('employee-apertura-activa', {
          body: { token: employeeSession.token },
          headers: {
            ...(anonKey ? { apikey: anonKey } : {}),
            Authorization: anonKey ? `Bearer ${anonKey}` : undefined
          }
        });
        if (!error && !data?.error) {
          apertura = data?.apertura || null;
        }
      } else {
        // Buscar apertura activa solo de este usuario (owner)
        const { data, error } = await supabase
          .from('aperturas_caja')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('user_id', userId)
          .is('cierre_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error) {
          apertura = data || null;
        }
      }

      // Si no hay apertura propia, verificar si estamos "sincronizados" a otra
      if (!apertura) {
        const syncedId = localStorage.getItem(`synced_apertura_${organizationId}`);
        if (syncedId) {
          const { data: syncedApertura, error: syncedError } = await supabase
            .from('aperturas_caja')
            .select('*')
            .eq('id', syncedId)
            .is('cierre_id', null)
            .maybeSingle();
          
          if (!syncedError && syncedApertura) {
            return { ...syncedApertura, is_synced: true };
          } else {
            // Ya no es válida o está cerrada
            localStorage.removeItem(`synced_apertura_${organizationId}`);
          }
        }
      }

      return apertura;
    },
    enabled: !!organizationId && !!userId,
    staleTime: 30 * 1000,
    cacheTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// Hook para detectar si OTROS usuarios tienen cajas abiertas en la misma organización
export const useOtrasCajasAbiertas = (organizationId, userId) => {
  return useQuery({
    queryKey: ['otras_cajas_abiertas', organizationId, userId],
    queryFn: async () => {
      if (!organizationId) return [];

      const employeeSession = getEmployeeSession();
      const currentEmployeeId = employeeSession?.employee?.id;

      // 1. Obtener aperturas básicas
      const { data: aperturas, error: errorAperturas } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organizationId)
        .is('cierre_id', null)
        .order('created_at', { ascending: false });

      if (errorAperturas || !aperturas) return [];

      // 2. Filtrar las que NO son mías
      const filtradas = aperturas.filter(apertura => {
        if (currentEmployeeId) {
          return apertura.employee_id !== currentEmployeeId;
        } else {
          return apertura.employee_id !== null || apertura.user_id !== userId;
        }
      });

      if (filtradas.length === 0) return [];

      // 3. Obtener nombres de responsables para mostrar en el modal (opcional pero recomendado)
      const employeeIds = filtradas.map(a => a.employee_id).filter(Boolean);
      const userIds = filtradas.map(a => a.user_id).filter(Boolean);

      try {
        const [ { data: employeesAuth }, { data: profiles } ] = await Promise.all([
          employeeIds.length > 0 
            ? supabase.from('employees').select('id, team_member_id, code').in('id', employeeIds)
            : Promise.resolve({ data: [] }),
          userIds.length > 0
            ? supabase.from('user_profiles').select('id, user_id, full_name').in('user_id', userIds)
            : Promise.resolve({ data: [] })
        ]);

        let teamMembers = [];
        if (employeesAuth && employeesAuth.length > 0) {
          const teamMemberIds = employeesAuth.map(e => e.team_member_id).filter(Boolean);
          if (teamMemberIds.length > 0) {
            const { data } = await supabase.from('team_members').select('id, employee_name').in('id', teamMemberIds);
            teamMembers = data || [];
          }
        }

        const teamMemberMap = new Map(teamMembers.map(t => [t.id, t.employee_name]));
        const employeeMap = new Map(employeesAuth?.map(e => [e.id, teamMemberMap.get(e.team_member_id) || `Empleado ${e.code}`]));
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

        // 4. Enriquecer las aperturas con los nombres
        return filtradas.map(a => ({
          ...a,
          vendedor: { employee_name: a.employee_id ? employeeMap.get(a.employee_id) : null },
          user_profile: { full_name: a.user_id ? profileMap.get(a.user_id) : null }
        }));
      } catch (err) {
        console.error('Error enriching otras cajas:', err);
        return filtradas; // Retornar sin nombres si falla el enriquecimiento
      }
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// Hook para crear una apertura de caja (propia, independiente)
export const useCrearAperturaCaja = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, userId, montoInicial }) => {
      const employeeSession = getEmployeeSession();
      if (employeeSession?.token) {
        const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const { data, error } = await supabase.functions.invoke('employee-open-caja', {
          body: { token: employeeSession.token, montoInicial },
          headers: {
            ...(anonKey ? { apikey: anonKey } : {}),
            Authorization: anonKey ? `Bearer ${anonKey}` : undefined
          }
        });
        if (error) {
          throw new Error(error.message || 'Error al crear apertura de caja');
        }
        if (data?.error) {
          throw new Error(data.error);
        }
        return data?.apertura;
      }

      if (!organizationId || !userId) {
        throw new Error('Faltan datos de organización o usuario');
      }

      // Verificar solo si ESTE usuario ya tiene una apertura activa
      const { data: miAperturaActiva, error: errorVerificacion } = await supabase
        .from('aperturas_caja')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .is('cierre_id', null)
        .maybeSingle();

      if (errorVerificacion) {
        throw new Error('Error al verificar apertura existente');
      }

      if (miAperturaActiva) {
        throw new Error('Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.');
      }

      // Crear la apertura independiente para este usuario
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
      queryClient.invalidateQueries(['apertura_caja_activa', data.organization_id, data.user_id]);
      queryClient.invalidateQueries(['otras_cajas_abiertas', data.organization_id]);
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
