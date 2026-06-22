import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';

const ProtectedRoute = ({ children }) => {
  const { user, loading, userProfile, organization } = useAuth();
  const location = useLocation();
  const [needsPasswordChange, setNeedsPasswordChange] = React.useState(false);
  const [checkingPassword, setCheckingPassword] = React.useState(true);
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || checkingPassword || (user && (!userProfile || !organization))) {
        setShowTimeoutError(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loading, checkingPassword, user, userProfile, organization]);

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
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #004481 0%, #02A5E0 100%)',
        color: 'white',
        gap: '20px'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>Cargando...</div>
        {showTimeoutError && (
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <p style={{ marginBottom: '15px' }}>Parece que hay un problema cargando tu perfil (sesión inválida o error de red).</p>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.clear();
                window.location.href = '/login';
              }}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cerrar sesión e intentar de nuevo
            </button>
          </div>
        )}
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

  // Desactivado temporalmente: no solicitar código de acceso al ingresar.
  // Para reactivar, volver a validar access_code_verified y redirigir a /codigo-acceso.

  return children;
};

export default ProtectedRoute;
