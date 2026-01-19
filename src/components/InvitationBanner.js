import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, X } from 'lucide-react';
import { useMyInvitations } from '../hooks/useTeam';
import './InvitationBanner.css';

const InvitationBanner = () => {
  const navigate = useNavigate();
  const { data: invitations, isLoading } = useMyInvitations();
  const [dismissed, setDismissed] = React.useState(false);

  // Filtrar solo invitaciones pendientes
  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];

  // No mostrar si no hay invitaciones o fue desmi dismiss
  if (isLoading || pendingInvitations.length === 0 || dismissed) {
    return null;
  }

  const handleGoToInvitations = () => {
    navigate('/invitaciones');
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="invitation-banner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="invitation-banner-content">
          <div className="invitation-banner-icon">
            <Mail size={24} />
          </div>
          <div className="invitation-banner-text">
            <h4>
              {pendingInvitations.length === 1 
                ? '¡Tienes 1 invitación pendiente!' 
                : `¡Tienes ${pendingInvitations.length} invitaciones pendientes!`
              }
            </h4>
            <p>
              {pendingInvitations[0]?.organization_id 
                ? 'Te han invitado a unirte a un equipo'
                : 'Revisa tus invitaciones para unirte a equipos'
              }
            </p>
          </div>
          <div className="invitation-banner-actions">
            <button 
              className="invitation-banner-btn primary"
              onClick={handleGoToInvitations}
            >
              Ver Invitaciones
              <ArrowRight size={18} />
            </button>
            <button 
              className="invitation-banner-btn dismiss"
              onClick={handleDismiss}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InvitationBanner;
