import { setEmployeeSession } from '../../utils/employeeSession';
import { supabase } from './supabaseClient';
import { hasBypassAccess } from '../../constants/vipUsers';

const getEmployeeAuthUrl = () => {
  const override = process.env.REACT_APP_EMPLOYEE_LOGIN_URL;
  if (override) return override;
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SUPABASE_URL) {
    return `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/employee-login`;
  }
  return '/auth/employee-login';
};

export const loginEmployee = async ({ username, code, password }) => {
  const payload = {
    username: String(username || '').toLowerCase().trim(),
    code: String(code || '').trim(),
    password: String(password || code || '')
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H5', location: 'employeeAuthApi.js:12', message: 'employeeLogin:request', data: { hasUsername: !!payload.username, hasCode: !!payload.code, codeLength: payload.code.length, hasPassword: !!payload.password }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion agent log

  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const authUrl = getEmployeeAuthUrl();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H10', location: 'employeeAuthApi.js:20', message: 'employeeLogin:url', data: { host: (new URL(authUrl, window.location.origin)).host, path: (new URL(authUrl, window.location.origin)).pathname }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion agent log
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H5', location: 'employeeAuthApi.js:24', message: 'employeeLogin:response', data: { status: response.status, ok: response.ok, hasToken: !!data?.token, errorCode: data?.code || null }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion agent log

  if (!response.ok) {
    throw new Error(data?.error || 'Error al iniciar sesión');
  }

  // Verificar plan de la organización para empleados
  const orgId = data.employee?.organization_id;
  if (orgId) {
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('email')
        .eq('id', orgId)
        .single();
        
      const orgEmail = orgData?.email;
      const isVip = hasBypassAccess({ email: orgEmail }, { owner_email: orgEmail });
      
      if (!isVip) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .maybeSingle();
          
        let blockLogin = false;
        if (subData && subData.current_period_end) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(subData.current_period_end);
          endDate.setHours(0, 0, 0, 0);
          const diffDays = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < -3) blockLogin = true;
        } else if (!subData) {
          blockLogin = true;
        }
        
        if (blockLogin) {
          throw new Error('Acceso denegado: La organización no tiene un plan activo o su suscripción está vencida.');
        }
      }
    } catch (err) {
      if (err.message.includes('Acceso denegado')) throw err;
      console.error('Error al verificar suscripción:', err);
    }
  }

  const session = {
    token: data.token,
    expiresAt: data.expiresAt,
    employee: data.employee,
    permissions: data.permissions || [],
    employee_username: payload.username || null
  };

  setEmployeeSession(session);
  return session;
};
