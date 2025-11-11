// 📊 Banner de alertas de límites alcanzados
import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './UsageBanner.css';

const UsageBanner = () => {
  const { checkLimit, isFreePlan, planSlug } = useSubscription();
  const [limits, setLimits] = useState({});
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isFreePlan) {
      loadLimits();
    }
  }, [isFreePlan]);

  const loadLimits = async () => {
    try {
      const [products, sales, users] = await Promise.all([
        checkLimit('maxProducts'),
        checkLimit('maxSalesPerMonth'),
        checkLimit('maxUsers')
      ]);
      
      setLimits({ products, sales, users });
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Guardar en localStorage para no mostrar por 24h
    localStorage.setItem('usage_banner_dismissed', Date.now().toString());
  };

  // Verificar si fue dismissed recientemente (últimas 24h)
  useEffect(() => {
    const dismissedTime = localStorage.getItem('usage_banner_dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      }
    }
  }, []);

  if (!isFreePlan || dismissed) return null;

  const productsPercent = limits.products?.percentage || 0;
  const salesPercent = limits.sales?.percentage || 0;
  const usersPercent = limits.users?.percentage || 0;

  // Solo mostrar si algún límite está en 70% o más
  const showBanner = productsPercent >= 70 || salesPercent >= 70 || usersPercent >= 70;

  if (!showBanner) return null;

  const getAlertLevel = (percent) => {
    if (percent >= 95) return 'critical';
    if (percent >= 85) return 'high';
    return 'warning';
  };

  const highestPercent = Math.max(productsPercent, salesPercent, usersPercent);
  const alertLevel = getAlertLevel(highestPercent);

  return (
    <AnimatePresence>
      <motion.div 
        className={`usage-banner usage-banner-${alertLevel}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="usage-banner-content">
          <div className="usage-banner-icon">
            <AlertTriangle size={24} />
          </div>
          
          <div className="usage-banner-info">
            <h4>
              {alertLevel === 'critical' && '⚠️ Límite casi alcanzado'}
              {alertLevel === 'high' && '⚠️ Te estás acercando al límite'}
              {alertLevel === 'warning' && '📊 Uso del plan'}
            </h4>
            
            <div className="usage-banner-details">
              {productsPercent >= 70 && (
                <span>
                  Productos: <strong>{limits.products.current}/{limits.products.limit}</strong> ({Math.round(productsPercent)}%)
                </span>
              )}
              {salesPercent >= 70 && (
                <span>
                  Ventas este mes: <strong>{limits.sales.current}/{limits.sales.limit}</strong> ({Math.round(salesPercent)}%)
                </span>
              )}
              {usersPercent >= 70 && (
                <span>
                  Usuarios: <strong>{limits.users.current}/{limits.users.limit}</strong> ({Math.round(usersPercent)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="usage-banner-actions">
          <button onClick={handleUpgrade} className="usage-banner-upgrade-btn">
            <Zap size={18} />
            Mejorar Plan
          </button>
          <button onClick={handleDismiss} className="usage-banner-dismiss-btn">
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UsageBanner;
