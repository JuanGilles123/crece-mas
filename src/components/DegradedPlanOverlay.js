// 🚫 Overlay de bloqueo para negocios degradados al plan gratis por no pago
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CreditCard, AlertTriangle, ShieldOff } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import './DegradedPlanOverlay.css';

/**
 * Componente que bloquea completamente una sección cuando el negocio fue
 * degradado al plan gratis por no pago. Muestra un mensaje contundente
 * que obliga al usuario a pagar para recuperar el acceso.
 * 
 * @param {string} moduleName - Nombre del módulo bloqueado (ej: "Inventario Avanzado")
 * @param {string} description - Descripción de lo que incluía el módulo
 * @param {React.ReactNode} children - Contenido a bloquear
 * @param {boolean} forceBlock - Si true, siempre bloquea (ignora plan check)
 */
const DegradedPlanOverlay = ({ 
  moduleName = 'Esta función',
  description,
  children,
  forceBlock = false
}) => {
  const navigate = useNavigate();
  const { isDegraded, degradedFromPlan, loading } = useSubscription();

  // No bloquear mientras carga
  if (loading) return <>{children}</>;

  // Si no está degradado y no se fuerza bloqueo, mostrar contenido normal
  if (!isDegraded && !forceBlock) return <>{children}</>;

  const planName = degradedFromPlan?.name || 'tu plan anterior';

  return (
    <div className="degraded-overlay-wrapper">
      {/* Contenido borroso de fondo */}
      <div className="degraded-overlay-content-blurred">
        {children}
      </div>
      
      {/* Overlay de bloqueo */}
      <AnimatePresence>
        <motion.div 
          className="degraded-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="degraded-overlay-card"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', damping: 20 }}
          >
            <div className="degraded-overlay-icon">
              <div className="degraded-icon-bg">
                <ShieldOff size={40} />
              </div>
              <div className="degraded-pulse-ring" />
            </div>

            <h2 className="degraded-overlay-title">
              <Lock size={20} />
              {moduleName} — Acceso Suspendido
            </h2>

            <div className="degraded-overlay-alert">
              <AlertTriangle size={18} />
              <span>
                Tu negocio fue degradado al plan <strong>Gratis</strong> porque el período de pago del plan <strong>"{planName}"</strong> venció.
              </span>
            </div>

            {description && (
              <p className="degraded-overlay-desc">{description}</p>
            )}

            <p className="degraded-overlay-message">
              Para recuperar el acceso completo a todas las funciones que venías utilizando, realiza el pago de tu suscripción ahora.
            </p>

            <div className="degraded-overlay-actions">
              <button 
                className="degraded-pay-btn"
                onClick={() => navigate('/pricing', { state: { renew: true } })}
              >
                <CreditCard size={20} />
                Renovar Suscripción Ahora
              </button>
              <button
                className="degraded-subscription-btn"
                onClick={() => navigate('/dashboard/suscripcion')}
              >
                Ver Detalles de Mi Plan
              </button>
            </div>

            <p className="degraded-overlay-footer">
              💬 ¿Necesitas ayuda? Escríbenos al <a href="https://wa.me/573046422366" target="_blank" rel="noopener noreferrer">WhatsApp: 304 642 2366</a>
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DegradedPlanOverlay;
