import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Building2, 
  CheckCircle, 
  Clock,
  Shield,
  ArrowRight,
  AlertCircle,
  LogIn,
  UserPlus
} from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import './InvitePublic.css';

const ROLES = {
  admin: {
    label: 'Administrador',
    icon: <Shield size={20} />,
    color: '#3B82F6',
    description: 'Gestión completa excepto facturación',
    permissions: [
      'Ver dashboard completo',
      'Gestionar inventario',
      'Realizar ventas',
      'Ver reportes',
      'Gestionar equipo'
    ]
  },
  inventory_manager: {
    label: 'Encargado de Inventario',
    icon: <Shield size={20} />,
    color: '#10B981',
    description: 'Gestión de inventario y ventas',
    permissions: [
      'Ver dashboard',
      'Gestionar inventario completo',
      'Realizar ventas',
      'Ver productos'
    ]
  },
  cashier: {
    label: 'Cajero',
    icon: <Shield size={20} />,
    color: '#8B5CF6',
    description: 'Solo módulo de caja',
    permissions: [
      'Acceso al módulo de caja',
      'Realizar ventas',
      'Ver inventario (solo lectura)',
      'Generar recibos'
    ]
  },
  viewer: {
    label: 'Visualizador',
    icon: <Shield size={20} />,
    color: '#6B7280',
    description: 'Solo lectura de reportes',
    permissions: [
      'Ver dashboard',
      'Ver reportes de ventas',
      'Solo lectura (sin edición)'
    ]
  }
};

const InvitePublic = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Token de invitación no válido');
        setLoading(false);
        return;
      }

      try {
        // Consulta pública - NO requiere autenticación
        const { data, error: fetchError } = await supabase
          .from('team_invitations')
          .select(`
            *,
            organizations (
              id,
              name,
              business_type
            )
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (fetchError) {
          console.error('Error fetching invitation:', fetchError);
          setError('No se pudo cargar la invitación. Puede que haya expirado o no exista.');
          setLoading(false);
          return;
        }

        // Verificar si expiró
        if (new Date(data.expires_at) < new Date()) {
          setError('Esta invitación ha expirado');
          setInvitation(data);
          setLoading(false);
          return;
        }

        setInvitation(data);
        setLoading(false);

        // Si el usuario ya está autenticado, guardamos el token para auto-aceptar
        if (user) {
          localStorage.setItem('pending_invitation_token', token);
        }

      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Error al cargar la invitación');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token, user]);

  const handleLogin = () => {
    // Guardar token en localStorage para aceptar después del login
    localStorage.setItem('pending_invitation_token', token);
    navigate('/login');
  };

  const handleRegister = () => {
    // Guardar token en localStorage para aceptar después del registro
    localStorage.setItem('pending_invitation_token', token);
    navigate('/register');
  };

  const handleAcceptNow = () => {
    // Si ya está autenticado, ir a la página de invitaciones para aceptar
    localStorage.setItem('pending_invitation_token', token);
    navigate('/invitaciones?token=' + token);
  };

  if (loading) {
    return (
      <div className="invite-public-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="invite-public-container">
        <motion.div 
          className="error-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle size={64} />
          <h2>Invitación no disponible</h2>
          <p>{error || 'No se encontró la invitación'}</p>
          {invitation && new Date(invitation.expires_at) < new Date() && (
            <p className="expired-text">Esta invitación expiró el {new Date(invitation.expires_at).toLocaleDateString('es-CO')}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const roleInfo = ROLES[invitation.role] || ROLES.viewer;
  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className="invite-public-container">
      <motion.div 
        className="invite-public-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="invite-header">
          <div className="invite-icon">
            <Mail size={48} />
          </div>
          <h1>Has sido invitado a un equipo</h1>
          <p className="invite-subtitle">
            Te han invitado a formar parte de una organización en Crece+
          </p>
        </div>

        <div className="organization-section">
          <div className="organization-badge">
            <Building2 size={40} />
          </div>
          <div className="organization-details">
            <h2>{invitation.organizations?.name || 'Organización'}</h2>
            <p className="business-type">
              {invitation.organizations?.business_type === 'food' && '🍔 Comida rápida'}
              {invitation.organizations?.business_type === 'clothing' && '👔 Ropa'}
              {invitation.organizations?.business_type === 'retail' && '🏪 Retail'}
              {invitation.organizations?.business_type === 'other' && '📦 Otro'}
            </p>
          </div>
        </div>

        <div className="role-section">
          <div className="role-badge" style={{ backgroundColor: roleInfo.color }}>
            {roleInfo.icon}
            <span>{roleInfo.label}</span>
          </div>
          <p className="role-description">{roleInfo.description}</p>
        </div>

        {invitation.message && (
          <div className="message-section">
            <h3>Mensaje del remitente:</h3>
            <div className="message-content">
              <Mail size={20} />
              <p>{invitation.message}</p>
            </div>
          </div>
        )}

        <div className="permissions-section">
          <h3>Con este rol podrás:</h3>
          <ul className="permissions-list">
            {roleInfo.permissions.map((permission, index) => (
              <li key={index}>
                <CheckCircle size={18} />
                {permission}
              </li>
            ))}
          </ul>
        </div>

        <div className="invitation-meta">
          <Clock size={18} />
          <span>
            {isExpired 
              ? 'Esta invitación ha expirado' 
              : `Válida hasta: ${new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}`
            }
          </span>
        </div>

        {!isExpired && (
          <div className="action-section">
            {user ? (
              // Usuario ya autenticado
              <div className="authenticated-actions">
                <p className="auth-message">
                  Estás conectado como <strong>{user.email}</strong>
                </p>
                <button 
                  className="btn btn-accept-primary"
                  onClick={handleAcceptNow}
                >
                  <CheckCircle size={20} />
                  Aceptar Invitación
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              // Usuario NO autenticado
              <div className="unauthenticated-actions">
                <p className="auth-required-text">
                  Para aceptar esta invitación necesitas:
                </p>
                <div className="action-buttons">
                  <button 
                    className="btn btn-register"
                    onClick={handleRegister}
                  >
                    <UserPlus size={20} />
                    Crear Cuenta
                  </button>
                  <button 
                    className="btn btn-login"
                    onClick={handleLogin}
                  >
                    <LogIn size={20} />
                    Iniciar Sesión
                  </button>
                </div>
                <p className="info-text">
                  La invitación se aceptará automáticamente después de iniciar sesión
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className="branding-footer">
        <p>Powered by <strong>Crece+</strong></p>
      </div>
    </div>
  );
};

export default InvitePublic;
