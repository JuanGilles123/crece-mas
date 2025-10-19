import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Edit3, 
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useTeamMembers,
  useInvitations,
  useCreateInvitation,
  useCancelInvitation,
  useUpdateMemberRole,
  useRemoveTeamMember
} from '../hooks/useTeam';
import toast from 'react-hot-toast';
import './GestionEquipo.css';

const ROLES = {
  owner: {
    label: 'Propietario',
    icon: <Crown size={16} />,
    color: '#FFD700',
    description: 'Acceso total al sistema'
  },
  admin: {
    label: 'Administrador',
    icon: <Shield size={16} />,
    color: '#3B82F6',
    description: 'Gestión completa excepto facturación'
  },
  inventory_manager: {
    label: 'Encargado de Inventario',
    icon: <Users size={16} />,
    color: '#10B981',
    description: 'Gestión de inventario y ventas'
  },
  cashier: {
    label: 'Cajero',
    icon: <Users size={16} />,
    color: '#8B5CF6',
    description: 'Solo módulo de caja'
  },
  viewer: {
    label: 'Visualizador',
    icon: <Users size={16} />,
    color: '#6B7280',
    description: 'Solo lectura de reportes'
  }
};

const InvitarModal = ({ open, onClose, onInvitar, cargando }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cashier');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !role) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    onInvitar({ email, role, mensaje });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h3><UserPlus size={24} /> Invitar Miembro al Equipo</h3>
          <button className="modal-close" onClick={onClose}>
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} />
              Correo electrónico *
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Shield size={16} />
              Rol *
            </label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {Object.entries(ROLES)
                .filter(([key]) => key !== 'owner')
                .map(([key, roleInfo]) => (
                  <option key={key} value={key}>
                    {roleInfo.label} - {roleInfo.description}
                  </option>
                ))}
            </select>
            <small className="form-hint">
              Selecciona el nivel de acceso para este miembro
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mensaje personalizado (opcional)
            </label>
            <textarea
              className="form-textarea"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe un mensaje de bienvenida..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={cargando}
            >
              <Send size={16} />
              {cargando ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const MemberCard = ({ member, onUpdateRole, onRemove, isOwner }) => {
  const [editando, setEditando] = useState(false);
  const [nuevoRole, setNuevoRole] = useState(member.role);

  const roleInfo = ROLES[member.role] || ROLES.viewer;

  const handleGuardarRole = () => {
    if (nuevoRole !== member.role) {
      onUpdateRole(member.id, nuevoRole);
    }
    setEditando(false);
  };

  return (
    <motion.div 
      className="member-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="member-avatar">
        {member.user_profiles?.avatar_url ? (
          <img src={member.user_profiles.avatar_url} alt={member.user_profiles?.full_name} />
        ) : (
          <Users size={24} />
        )}
      </div>

      <div className="member-info">
        <div className="member-name">
          {member.user_profiles?.full_name || 'Sin nombre'}
          {member.role === 'owner' && (
            <span className="owner-badge">
              <Crown size={14} /> Propietario
            </span>
          )}
        </div>
        <div className="member-email">{member.email}</div>
        {member.user_profiles?.phone && (
          <div className="member-phone">{member.user_profiles.phone}</div>
        )}
      </div>

      <div className="member-role">
        {editando && member.role !== 'owner' ? (
          <div className="role-edit">
            <select
              className="role-select"
              value={nuevoRole}
              onChange={(e) => setNuevoRole(e.target.value)}
            >
              {Object.entries(ROLES)
                .filter(([key]) => key !== 'owner')
                .map(([key, roleInfo]) => (
                  <option key={key} value={key}>
                    {roleInfo.label}
                  </option>
                ))}
            </select>
            <button className="btn-icon btn-success" onClick={handleGuardarRole}>
              <CheckCircle size={16} />
            </button>
            <button className="btn-icon btn-cancel" onClick={() => setEditando(false)}>
              <XCircle size={16} />
            </button>
          </div>
        ) : (
          <div className="role-badge" style={{ backgroundColor: roleInfo.color }}>
            {roleInfo.icon}
            {roleInfo.label}
          </div>
        )}
      </div>

      {isOwner && member.role !== 'owner' && member.status === 'active' && (
        <div className="member-actions">
          {!editando && (
            <button 
              className="btn-icon btn-edit"
              onClick={() => setEditando(true)}
              title="Cambiar rol"
            >
              <Edit3 size={16} />
            </button>
          )}
          <button 
            className="btn-icon btn-danger"
            onClick={() => onRemove(member.id)}
            title="Remover del equipo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {member.status === 'inactive' && (
        <div className="member-status inactive">Inactivo</div>
      )}
    </motion.div>
  );
};

const InvitationCard = ({ invitation, onCancel }) => {
  const roleInfo = ROLES[invitation.role] || ROLES.viewer;

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link de invitación copiado');
  };

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <motion.div 
      className={`invitation-card ${isExpired ? 'expired' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      layout
    >
      <div className="invitation-info">
        <div className="invitation-email">
          <Mail size={16} />
          {invitation.email}
        </div>
        <div className="invitation-role">
          <div className="role-badge small" style={{ backgroundColor: roleInfo.color }}>
            {roleInfo.icon}
            {roleInfo.label}
          </div>
        </div>
        <div className="invitation-date">
          <Clock size={14} />
          {isExpired ? 'Expirada' : `Expira: ${new Date(invitation.expires_at).toLocaleDateString()}`}
        </div>
      </div>

      <div className="invitation-actions">
        {!isExpired && (
          <button 
            className="btn-icon btn-secondary"
            onClick={handleCopyLink}
            title="Copiar link de invitación"
          >
            <Copy size={16} />
          </button>
        )}
        <button 
          className="btn-icon btn-danger"
          onClick={() => onCancel(invitation.id)}
          title="Cancelar invitación"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const GestionEquipo = () => {
  const { user, organization, hasRole } = useAuth();
  const [invitarModalOpen, setInvitarModalOpen] = useState(false);

  // Hooks de datos
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers(organization?.id);
  const { data: invitations = [], isLoading: loadingInvitations } = useInvitations(organization?.id);

  // Hooks de mutaciones
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();
  const updateMemberRole = useUpdateMemberRole();
  const removeTeamMember = useRemoveTeamMember();

  const isOwner = hasRole('owner', 'admin');

  const handleInvitar = async ({ email, role, mensaje }) => {
    try {
      await createInvitation.mutateAsync({
        organizationId: organization.id,
        email,
        role,
        message: mensaje
      });
      setInvitarModalOpen(false);
    } catch (error) {
      console.error('Error invitando:', error);
    }
  };

  const handleCancelarInvitacion = async (invitationId) => {
    if (window.confirm('¿Estás seguro de cancelar esta invitación?')) {
      await cancelInvitation.mutateAsync(invitationId);
    }
  };

  const handleActualizarRole = async (memberId, newRole) => {
    if (window.confirm('¿Estás seguro de cambiar el rol de este miembro?')) {
      await updateMemberRole.mutateAsync({
        memberId,
        newRole,
        organizationId: organization.id
      });
    }
  };

  const handleRemoverMiembro = async (memberId) => {
    if (window.confirm('¿Estás seguro de remover este miembro del equipo?')) {
      await removeTeamMember.mutateAsync({
        memberId,
        organizationId: organization.id
      });
    }
  };

  if (!organization) {
    return (
      <div className="gestion-equipo-container">
        <div className="no-organization">
          <Users size={48} />
          <h3>No tienes una organización</h3>
          <p>Crea una organización para gestionar tu equipo.</p>
        </div>
      </div>
    );
  }

  const activeMembers = teamMembers.filter(m => m.status === 'active');
  const limitReached = activeMembers.length >= organization.max_team_members;

  return (
    <div className="gestion-equipo-container">
      <div className="gestion-equipo-header">
        <div className="header-content">
          <h1>
            <Users size={32} />
            Gestión de Equipo
          </h1>
          <p>Gestiona los miembros y roles de tu equipo</p>
        </div>

        {isOwner && (
          <button 
            className="btn btn-primary"
            onClick={() => setInvitarModalOpen(true)}
            disabled={limitReached}
          >
            <UserPlus size={20} />
            Invitar Miembro
          </button>
        )}
      </div>

      {limitReached && isOwner && (
        <div className="alert alert-warning">
          <span>⚠️ Has alcanzado el límite de {organization.max_team_members} miembros en tu plan.</span>
          <button className="btn btn-link">Actualizar plan</button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="team-stats">
        <div className="stat-card">
          <div className="stat-value">{activeMembers.length}</div>
          <div className="stat-label">Miembros Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{invitations.length}</div>
          <div className="stat-label">Invitaciones Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{organization.max_team_members - activeMembers.length}</div>
          <div className="stat-label">Espacios Disponibles</div>
        </div>
      </div>

      {/* Miembros del equipo */}
      <div className="team-section">
        <h2>Miembros del Equipo ({activeMembers.length})</h2>
        {loadingMembers ? (
          <div className="loading">Cargando miembros...</div>
        ) : activeMembers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>No hay miembros en el equipo todavía</p>
          </div>
        ) : (
          <div className="members-grid">
            {activeMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onUpdateRole={handleActualizarRole}
                onRemove={handleRemoverMiembro}
                isOwner={isOwner}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invitaciones pendientes */}
      {isOwner && invitations.length > 0 && (
        <div className="team-section">
          <h2>Invitaciones Pendientes ({invitations.length})</h2>
          <div className="invitations-list">
            {invitations.map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onCancel={handleCancelarInvitacion}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de invitación */}
      <AnimatePresence>
        {invitarModalOpen && (
          <InvitarModal
            open={invitarModalOpen}
            onClose={() => setInvitarModalOpen(false)}
            onInvitar={handleInvitar}
            cargando={createInvitation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionEquipo;
