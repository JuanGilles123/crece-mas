import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useMyInvitations,
  useAcceptInvitation,
  useRejectInvitation
} from '../hooks/useTeam';
import { getBusinessTypeConfig } from '../constants/businessTypes';
import './Invitaciones.css';

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

const InvitationCard = ({ invitation, onAccept, onReject, loading }) => {
  const roleInfo = ROLES[invitation.role] || ROLES.viewer;
  const businessTypeConfig = getBusinessTypeConfig(invitation.organizations?.business_type);
  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <motion.div 
      className={`invitation-detail-card ${isExpired ? 'expired' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isExpired && (
        <div className="expired-banner">
          <AlertCircle size={20} />
          Esta invitación ha expirado
        </div>
      )}

      <div className="invitation-header">
        <div className="organization-info">
          <div className="organization-icon">
            <Building2 size={32} />
          </div>
          <div>
            <h2>{invitation.organizations?.name || 'Organización'}</h2>
            <p className="business-type">
              {businessTypeConfig?.Icon && <businessTypeConfig.Icon size={16} />}
              {businessTypeConfig?.label || 'Otro'}
            </p>
          </div>
        </div>

        <div className="role-info">
          <div className="role-badge-large" style={{ backgroundColor: roleInfo.color }}>
            {roleInfo.icon}
            {roleInfo.label}
          </div>
          <p className="role-description">{roleInfo.description}</p>
        </div>
      </div>

      {invitation.message && (
        <div className="invitation-message">
          <Mail size={18} />
          <p>{invitation.message}</p>
        </div>
      )}

      <div className="permissions-section">
        <h3>Permisos que tendrás:</h3>
        <ul className="permissions-list">
          {roleInfo.permissions.map((permission, index) => (
            <li key={index}>
              <CheckCircle size={16} />
              {permission}
            </li>
          ))}
        </ul>
      </div>

      <div className="invitation-meta">
        <div className="meta-item">
          <Clock size={16} />
          <span>
            {isExpired 
              ? 'Expirada' 
              : `Expira: ${new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}`
            }
          </span>
        </div>
        <div className="meta-item">
          <Mail size={16} />
          <span>{invitation.email}</span>
        </div>
      </div>

      {!isExpired && (
        <div className="invitation-actions">
          <button 
            className="btn btn-reject"
            onClick={() => onReject(invitation.id)}
            disabled={loading}
          >
            <XCircle size={20} />
            Rechazar
          </button>
          <button 
            className="btn btn-accept"
            onClick={() => onAccept(invitation.token)}
            disabled={loading}
          >
            <CheckCircle size={20} />
            {loading ? 'Aceptando...' : 'Aceptar Invitación'}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const Invitaciones = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const { data: invitations = [], isLoading } = useMyInvitations(user?.email);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // Si hay un token en la URL, buscar esa invitación específica
  useEffect(() => {
    if (token && invitations.length > 0) {
      const invitation = invitations.find(inv => inv.token === token);
      if (invitation) {
        setSelectedInvitation(invitation);
      }
    } else if (invitations.length === 1) {
      setSelectedInvitation(invitations[0]);
    }
  }, [token, invitations]);

  const handleAccept = async (invitationToken) => {
    try {
      await acceptInvitation.mutateAsync(invitationToken);
      // Redirigir al dashboard después de aceptar
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleReject = async (invitationId) => {
    if (window.confirm('¿Estás seguro de rechazar esta invitación?')) {
      try {
        await rejectInvitation.mutateAsync(invitationId);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error rejecting invitation:', error);
      }
    }
  };

  // Requiere autenticación
  if (authLoading) {
    return (
      <div className="invitaciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="invitaciones-container">
        <div className="auth-required">
          <AlertCircle size={48} />
          <h2>Inicia sesión para ver tus invitaciones</h2>
          <p>Necesitas estar autenticado para aceptar invitaciones de equipo.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="invitaciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando invitaciones...</p>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="invitaciones-container">
        <div className="empty-invitations">
          <Mail size={64} />
          <h2>No tienes invitaciones pendientes</h2>
          <p>Cuando alguien te invite a un equipo, las invitaciones aparecerán aquí.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invitaciones-container">
      <motion.div 
        className="invitaciones-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>
          <Mail size={32} />
          Tus Invitaciones
        </h1>
        <p>
          {invitations.length === 1 
            ? 'Tienes 1 invitación pendiente'
            : `Tienes ${invitations.length} invitaciones pendientes`
          }
        </p>
      </motion.div>

      <div className="invitations-grid">
        {selectedInvitation ? (
          <InvitationCard 
            invitation={selectedInvitation}
            onAccept={handleAccept}
            onReject={handleReject}
            loading={acceptInvitation.isLoading || rejectInvitation.isLoading}
          />
        ) : (
          invitations.map((invitation, index) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <InvitationCard 
                invitation={invitation}
                onAccept={handleAccept}
                onReject={handleReject}
                loading={acceptInvitation.isLoading || rejectInvitation.isLoading}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Invitaciones;
