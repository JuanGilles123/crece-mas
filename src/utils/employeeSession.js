const EMPLOYEE_SESSION_KEY = 'employee_session_v1';

export const getEmployeeSession = () => {
  try {
    const raw = localStorage.getItem(EMPLOYEE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.employee) return null;
    if (parsed?.expiresAt) {
      const expiresAt = new Date(parsed.expiresAt).getTime();
      if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
        localStorage.removeItem(EMPLOYEE_SESSION_KEY);
        return null;
      }
    }
    return parsed;
  } catch (error) {
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    return null;
  }
};

export const setEmployeeSession = (session) => {
  if (!session) return;
  localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session));
};

export const clearEmployeeSession = () => {
  localStorage.removeItem(EMPLOYEE_SESSION_KEY);
};
