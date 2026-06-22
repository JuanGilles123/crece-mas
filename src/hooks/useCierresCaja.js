import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';

// Hook para obtener cierres de caja
export const useCierresCaja = (organizationId, limit = 100, employeeId = null) => {
  return useQuery({
    queryKey: ['cierres_caja', organizationId, limit, employeeId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('cierres_caja')
        .select('*')
        .eq('organization_id', organizationId);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching cierres_caja:', error);
        throw new Error('Error al cargar cierres de caja');
      }
      const cierres = data || [];
      const employeeIds = Array.from(
        new Set(cierres.map((cierre) => cierre.employee_id).filter(Boolean))
      );

      let employeesById = {};
      if (employeeIds.length > 0) {
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, team_members(id, employee_name)')
          .in('id', employeeIds);

        if (employeesError) {
          console.warn('Error fetching employees for cierres:', employeesError);
        } else if (employeesData) {
          employeesById = employeesData.reduce((acc, emp) => {
            acc[emp.id] = {
              id: emp.id,
              employee_name: emp.team_members?.employee_name
            };
            return acc;
          }, {});
        }
      }

      const userIds = Array.from(
        new Set(cierres.map((cierre) => cierre.user_id).filter(Boolean))
      );

      let usersById = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('id, full_name, nombre')
          .in('id', userIds);
          
        if (!usersError && usersData) {
          usersById = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const cierreIds = cierres.map((cierre) => cierre.id);
      let aperturesMap = {};
      if (cierreIds.length > 0) {
        const { data: aperturasData, error: aperturasError } = await supabase
          .from('aperturas_caja')
          .select('cierre_id, monto_inicial')
          .in('cierre_id', cierreIds);
        
        if (!aperturasError && aperturasData) {
          aperturesMap = aperturasData.reduce((acc, ap) => {
            if (ap.cierre_id) {
              acc[ap.cierre_id] = ap.monto_inicial || 0;
            }
            return acc;
          }, {});
        }
      }

      return cierres.map((cierre) => ({
        ...cierre,
        employee: cierre.employee_id ? employeesById[cierre.employee_id] || null : null,
        user_profile: cierre.user_id ? usersById[cierre.user_id] || null : null,
        monto_inicial: aperturesMap[cierre.id] || 0,
      }));
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

