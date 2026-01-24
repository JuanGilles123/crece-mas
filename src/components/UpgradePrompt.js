import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UpgradePrompt.css';

const UpgradePrompt = ({ 
  feature, 
  featureName,
  reason, 
  currentPlan = 'free',
  recommendedPlan = 'professional',
  inline = false, // inline para dentro de páginas, modal para popups
  onClose
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
    if (onClose) onClose();
  };

  const getPlanName = (slug) => {
    const names = {
      free: 'Gratis',
      professional: 'Estándar',
      enterprise: 'Premium',
      custom: 'Custom'
    };
    return names[slug] || slug;
  };

  const getPlanPrice = (slug) => {
    const prices = {
      professional: '$69.900',
      enterprise: '$119.900',
      custom: 'Personalizado'
    };
    return prices[slug] || '';
  };

  const getPlanBenefits = (slug) => {
    const benefits = {
      professional: [
        '✅ Productos ilimitados',
        '✅ Ventas ilimitadas',
        '✅ Gestión de equipo (hasta 10 usuarios)',
        '✅ Reportes avanzados',
        '✅ Exportación de datos',
        '✅ Imágenes de productos',
        '✅ Múltiples métodos de pago'
      ],
      enterprise: [
        '✅ Todo del plan Estándar',
        '✅ Multi-sucursal (hasta 5 organizaciones)',
        '✅ Usuarios ilimitados',
        '✅ API para integraciones',
        '✅ Soporte prioritario 24/7',
        '✅ Branding personalizado',
        '✅ Account Manager dedicado'
      ]
    };
    return benefits[slug] || [];
  };

  if (inline) {
    return (
      <motion.div 
        className="upgrade-prompt-inline"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="upgrade-inline-icon">
          <Sparkles size={24} />
        </div>
        <div className="upgrade-inline-content">
          <h3>
            <Sparkles size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Función del Plan {getPlanName(recommendedPlan)}
          </h3>
          <p>{reason || `"${featureName || feature}" está disponible en el plan ${getPlanName(recommendedPlan)}. Actualiza tu plan para acceder a esta función.`}</p>
          <button onClick={handleUpgrade} className="upgrade-inline-button">
            <Zap size={18} />
            Ver Plan {getPlanName(recommendedPlan)} y Actualizar
            <ExternalLink size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="upgrade-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target.classList.contains('upgrade-modal-overlay') && onClose) {
            onClose();
          }
        }}
      >
        <motion.div 
          className="upgrade-modal"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {onClose && (
            <button className="upgrade-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          )}

          <div className="upgrade-modal-icon">
            <Sparkles size={48} />
          </div>
          
          <h2>
            <Sparkles size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Función del Plan {getPlanName(recommendedPlan)}
          </h2>
          <p className="upgrade-reason">{reason || `"${featureName || feature}" está disponible en el plan ${getPlanName(recommendedPlan)}. Actualiza tu plan para acceder a esta función.`}</p>
          
          <div className="upgrade-plan-info">
            <div className="upgrade-plan-header">
              <span className="upgrade-plan-name">{getPlanName(recommendedPlan)}</span>
              {getPlanPrice(recommendedPlan) && (
                <span className="upgrade-plan-price">{getPlanPrice(recommendedPlan)}/mes</span>
              )}
            </div>
          </div>

          <div className="upgrade-benefits">
            <h4>Con el plan {getPlanName(recommendedPlan)} obtienes:</h4>
            <ul>
              {getPlanBenefits(recommendedPlan).map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
          
          <div className="upgrade-modal-actions">
            <button onClick={handleUpgrade} className="btn-upgrade-primary">
              <Zap size={20} />
              Ver Plan {getPlanName(recommendedPlan)} y Actualizar
              <ExternalLink size={18} />
            </button>
            {onClose && (
              <button onClick={onClose} className="btn-upgrade-secondary">
                Tal vez después
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePrompt;
