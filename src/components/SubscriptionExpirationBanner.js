// 🔔 Banner de alerta de vencimiento de suscripción
import React, { useState, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, XCircle, X, CreditCard, TrendingDown } from 'lucide-react';
import './SubscriptionExpirationBanner.css';

/**
 * Calcula el estado de vencimiento basado en la fecha de fin del período.
 * @param {string|null} periodEnd - ISO date string de current_period_end
 * @param {boolean} isGracePeriodExpired - si el período de gracia ya expiró
 * @returns {{ type: 'warning'|'due_today'|'overdue'|'degraded', daysLeft: number } | null}
 */
const getExpirationStatus = (periodEnd, isGracePeriodExpired) => {
  if (!periodEnd) return null;

  // Si la gracia ya expiró, el plan fue degradado
  if (isGracePeriodExpired) {
    return { type: 'degraded', daysLeft: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(periodEnd);
  endDate.setHours(0, 0, 0, 0);

  const diffMs = endDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { type: 'due_today', daysLeft: 0 };
  } else if (diffDays > 0 && diffDays <= 3) {
    return { type: 'warning', daysLeft: diffDays };
  } else if (diffDays < 0 && diffDays >= -3) {
    return { type: 'overdue', daysLeft: Math.abs(diffDays), daysLeft3: 3 - Math.abs(diffDays) };
  }

  return null;
};


const SubscriptionExpirationBanner = () => {
  const { subscription, isFreePlan, isVIP, loading } = useSubscription();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const status = useMemo(() => {
    if (loading || isVIP) return null;
    // Si el plan es free y hay un plan degradado → mostrar estado degraded
    if (isFreePlan && subscription?.degradedFromPlan) {
      return { type: 'degraded', daysLeft: 0 };
    }
    // Si es free sin degradación → no mostrar (nunca tuvo plan)
    if (isFreePlan) return null;
    return getExpirationStatus(
      subscription?.current_period_end,
      subscription?.isGracePeriodExpired
    );
  }, [subscription, isFreePlan, isVIP, loading]);

  // El dismiss es solo de sesión: al cambiar de página o refrescar vuelve a aparecer
  const handleDismiss = () => {
    if (!status || status.type === 'degraded') return;
    setDismissed(true);
  };

  const handlePayNow = () => {
    navigate('/pricing', { state: { renew: true } });
  };

  if (!status || dismissed) return null;

  const planName = subscription?.degradedFromPlan?.name || subscription?.originalPlan?.name || 'tu plan anterior';

  const config = {
    warning: {
      icon: <Bell size={22} />,
      title: `⏰ Tu plan vence en ${status.daysLeft} día${status.daysLeft !== 1 ? 's' : ''}`,
      message: 'Renueva tu suscripción para seguir disfrutando de todos los beneficios sin interrupciones.',
      actionLabel: 'Renovar ahora',
      className: 'sub-expiry-warning',
      canDismiss: true,
    },
    due_today: {
      icon: <AlertTriangle size={22} />,
      title: '🚨 ¡Tu plan vence HOY!',
      message: 'Es el último día de tu período. Realiza el pago ahora para no perder el acceso a tus funciones.',
      actionLabel: 'Realizar pago',
      className: 'sub-expiry-due-today',
      canDismiss: true,
    },
    overdue: {
      icon: <XCircle size={22} />,
      title: `⚠️ Período de gracia: ${status.daysLeft3 ?? 0} día${(status.daysLeft3 ?? 0) !== 1 ? 's' : ''} restante${(status.daysLeft3 ?? 0) !== 1 ? 's' : ''}`,
      message: `Tu plan lleva ${status.daysLeft} día${status.daysLeft !== 1 ? 's' : ''} vencido. Tienes hasta 3 días de gracia — después perderás las funciones de tu plan.`,
      actionLabel: 'Pagar ahora',
      className: 'sub-expiry-overdue',
      canDismiss: true,
    },
    degraded: {
      icon: <TrendingDown size={22} />,
      title: '📉 Tu plan fue degradado al plan Gratis',
      message: `El período de gracia venció. Para recuperar todas las funciones de "${planName}" realiza el pago ahora.`,
      actionLabel: `Recuperar ${planName}`,
      className: 'sub-expiry-degraded',
      canDismiss: false, // No se puede cerrar — es persistente
    },
  };

  const { icon, title, message, actionLabel, className, canDismiss } = config[status.type];

  return (
    <AnimatePresence>
      <motion.div
        className={`sub-expiry-banner ${className}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
      >
        <div className="sub-expiry-icon">{icon}</div>

        <div className="sub-expiry-body">
          <p className="sub-expiry-title">{title}</p>
          <p className="sub-expiry-message">{message}</p>
        </div>

        <div className="sub-expiry-actions">
          <button className="sub-expiry-pay-btn" onClick={handlePayNow}>
            <CreditCard size={16} />
            {actionLabel}
          </button>
          {canDismiss && (
            <button className="sub-expiry-dismiss-btn" onClick={handleDismiss} aria-label="Cerrar alerta">
              <X size={18} color="#111" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionExpirationBanner;
