import { setEmployeeSession } from '../../utils/employeeSession';

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



  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const authUrl = getEmployeeAuthUrl();

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));



  if (!response.ok) {
    throw new Error(data?.error || 'Error al iniciar sesión');
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
