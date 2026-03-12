// 🔔 Banner de alerta de vencimiento de suscripción
import React, { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, XCircle, X, CreditCard } from 'lucide-react';
import './SubscriptionExpirationBanner.css';

/**
 * Calcula el estado de vencimiento basado en la fecha de fin del período.
 * Retorna null si no aplica alerta.
 * @param {string|null} periodEnd - ISO date string de current_period_end
 * @returns {{ type: 'warning'|'due_today'|'overdue', daysLeft: number } | null}
 */
const getExpirationStatus = (periodEnd) => {
  if (!periodEnd) return null;

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
    return { type: 'overdue', daysLeft: Math.abs(diffDays) };
  }

  return null;
};

const DISMISS_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 horas

const SubscriptionExpirationBanner = () => {
  const { subscription, isFreePlan, isVIP, loading } = useSubscription();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const status = useMemo(() => {
    if (loading || isFreePlan || isVIP) return null;
    return getExpirationStatus(subscription?.current_period_end);
  }, [subscription, isFreePlan, isVIP, loading]);

  // Verificar si fue descartado recientemente (por tipo de alerta)
  useEffect(() => {
    if (!status) return;
    const key = `sub_expiry_dismissed_${status.type}`;
    const dismissedTime = localStorage.getItem(key);
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < DISMISS_COOLDOWN_MS) {
        setDismissed(true);
      } else {
        // Cooldown expirado, limpiar
        localStorage.removeItem(key);
        setDismissed(false);
      }
    } else {
      setDismissed(false);
    }
  }, [status]);

  const handleDismiss = () => {
    if (!status) return;
    const key = `sub_expiry_dismissed_${status.type}`;
    localStorage.setItem(key, Date.now().toString());
    setDismissed(true);
  };

  const handlePayNow = () => {
    // Redirige a /pricing con flag 'renew' para que el botón del plan actual se habilite
    navigate('/pricing', { state: { renew: true } });
  };

  if (!status || dismissed) return null;

  const config = {
    warning: {
      icon: <Bell size={22} />,
      title: `⏰ Tu plan vence en ${status.daysLeft} día${status.daysLeft !== 1 ? 's' : ''}`,
      message: 'Renueva tu suscripción para seguir disfrutando de todos los beneficios sin interrupciones.',
      actionLabel: 'Renovar ahora',
      className: 'sub-expiry-warning',
    },
    due_today: {
      icon: <AlertTriangle size={22} />,
      title: '🚨 ¡Tu plan vence HOY!',
      message: 'Es el último día de tu período. Realiza el pago ahora para no perder el acceso. ¡Tu plan sigue activo!',
      actionLabel: 'Realizar pago',
      className: 'sub-expiry-due-today',
    },
    overdue: {
      icon: <XCircle size={22} />,
      title: `🔴 ¡Pago pendiente hace ${status.daysLeft} día${status.daysLeft !== 1 ? 's' : ''}!`,
      message: 'Tu plan sigue activo por ahora, pero renueva ya para evitar perder todos tus beneficios e historial.',
      actionLabel: 'Pagar ahora',
      className: 'sub-expiry-overdue',
    },
  };

  const { icon, title, message, actionLabel, className } = config[status.type];

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
          <button className="sub-expiry-dismiss-btn" onClick={handleDismiss} aria-label="Cerrar alerta">
            <X size={18} color="#111" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionExpirationBanner;
