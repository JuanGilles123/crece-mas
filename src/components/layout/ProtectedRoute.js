import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, userProfile, organization } = useAuth();
  const location = useLocation();
  const [needsPasswordChange, setNeedsPasswordChange] = React.useState(false);
  const [checkingPassword, setCheckingPassword] = React.useState(true);

  useEffect(() => {
    const checkPasswordChange = async () => {
      if (!user) {
        setCheckingPassword(false);
        return;
      }

      // Verificar si necesita cambiar contraseña (excepto si ya está en la página de cambio)
      if (location.pathname !== '/cambiar-contrasena-obligatorio') {
        const needsChange = user.user_metadata?.needs_password_change === true;
        setNeedsPasswordChange(needsChange);
      }
      
      setCheckingPassword(false);
    };

    if (!loading && user) {
      checkPasswordChange();
    } else if (!loading && !user) {
      setCheckingPassword(false);
    }
  }, [user, loading, location.pathname]);

  if (loading || checkingPassword || (user && (!userProfile || !organization))) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si necesita cambiar contraseña y no está en la página de cambio, redirigir
  if (needsPasswordChange && location.pathname !== '/cambiar-contrasena-obligatorio') {
    return <Navigate to="/cambiar-contrasena-obligatorio" replace />;
  }

  const isAccessCodeRoute = location.pathname === '/codigo-acceso';
  const accessKey = user && organization ? `access_code_verified:${organization.id}:${user.id}` : null;
  const accessVerified = accessKey ? localStorage.getItem(accessKey) === 'true' : false;

  if (!isAccessCodeRoute && !accessVerified) {
    return <Navigate to="/codigo-acceso" replace />;
  }

  return children;
};

export default ProtectedRoute;
