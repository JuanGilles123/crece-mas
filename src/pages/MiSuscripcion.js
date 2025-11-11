import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  Crown,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import LottieLoader from '../components/LottieLoader';
import toast from 'react-hot-toast';
import './MiSuscripcion.css';

const MiSuscripcion = () => {
  const navigate = useNavigate();
  const { organization, user } = useAuth();
  const { 
    subscription, 
    loading, 
    planName,
    checkLimit,
    refreshSubscription,
    isFreePlan,
    isVIP
  } = useSubscription();

  const [cancelando, setCancelando] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [usageStats, setUsageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Cargar estadísticas de uso
  React.useEffect(() => {
    loadUsageStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const loadUsageStats = async () => {
    if (!organization?.id) return;
    
    setLoadingStats(true);
    try {
      const [products, sales, users] = await Promise.all([
        checkLimit('maxProducts'),
        checkLimit('maxSalesPerMonth'),
        checkLimit('maxUsers')
      ]);

      setUsageStats({
        products,
        sales,
        users
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCancelarSuscripcion = async () => {
    if (!motivoCancelacion.trim()) {
      toast.error('Por favor, indica el motivo de cancelación');
      return;
    }

    setCancelando(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organization.id)
        .eq('status', 'active');

      if (error) throw error;

      // Guardar motivo de cancelación
      await supabase.from('subscription_cancellations').insert({
        organization_id: organization.id,
        subscription_id: subscription?.id,
        reason: motivoCancelacion,
        cancelled_by: user.id
      });

      toast.success('Suscripción cancelada. Tendrás acceso hasta el final del período pagado.');
      setMostrarModalCancelar(false);
      await refreshSubscription();
    } catch (error) {
      console.error('Error cancelando:', error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setCancelando(false);
    }
  };

  const handleReactivarSuscripcion = async () => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organization.id);

      if (error) throw error;

      toast.success('¡Suscripción reactivada exitosamente!');
      await refreshSubscription();
    } catch (error) {
      console.error('Error reactivando:', error);
      toast.error('Error al reactivar la suscripción');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUsagePercentage = (current, limit) => {
    if (!limit || limit === null) return 0;
    return Math.round((current / limit) * 100);
  };

  if (loading || loadingStats) {
    return (
      <div className="mi-suscripcion-loading">
        <LottieLoader size="large" message="Cargando suscripción..." />
      </div>
    );
  }

  const isPendingCancellation = subscription?.cancel_at_period_end;

  return (
    <div className="mi-suscripcion-page">
      {/* Header */}
      <div className="suscripcion-header">
        <h1>Mi Suscripción</h1>
        <p className="subtitle">{organization?.name}</p>
      </div>

      <div className="suscripcion-content">
        {/* Plan Actual */}
        <motion.div
          className={`plan-actual-card ${isVIP ? 'vip' : isFreePlan ? 'free' : 'premium'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="plan-header">
            <div className="plan-icon">
              {isVIP ? <Sparkles size={40} /> : <Crown size={40} />}
            </div>
            <div className="plan-info">
              <h2>{isVIP ? 'VIP Developer' : `Plan ${planName}`}</h2>
              <p className="plan-description">
                {isVIP 
                  ? 'Acceso completo e ilimitado a todas las funciones'
                  : isFreePlan 
                    ? 'Plan gratuito con funcionalidades básicas'
                    : 'Acceso completo a funcionalidades avanzadas'}
              </p>
            </div>
            {!isVIP && !isFreePlan && (
              <div className="plan-precio">
                <span className="precio-label">Precio mensual</span>
                <span className="precio-valor">{formatCurrency(subscription?.plan?.price_monthly || 0)}</span>
              </div>
            )}
          </div>

          {isPendingCancellation && !isVIP && (
            <div className="cancelacion-alert">
              <AlertTriangle size={20} />
              <div>
                <strong>Suscripción programada para cancelar</strong>
                <p>Tu acceso finalizará el {formatDate(subscription?.current_period_end)}</p>
              </div>
              <button 
                className="btn-reactivar"
                onClick={handleReactivarSuscripcion}
              >
                Reactivar
              </button>
            </div>
          )}

          {/* Detalles de facturación */}
          {!isVIP && !isFreePlan && (
            <div className="billing-details">
              <div className="billing-item">
                <Calendar size={18} />
                <div>
                  <span className="billing-label">Próxima facturación</span>
                  <span className="billing-value">{formatDate(subscription?.current_period_end)}</span>
                </div>
              </div>
              <div className="billing-item">
                <CheckCircle size={18} />
                <div>
                  <span className="billing-label">Estado</span>
                  <span className={`billing-value status-${subscription?.status}`}>
                    {subscription?.status === 'active' ? 'Activa' : 'Cancelada'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Uso Actual */}
        {usageStats && (
          <motion.div
            className="uso-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>
              <TrendingUp size={24} />
              Uso Actual
            </h3>

            <div className="usage-grid">
              {/* Productos */}
              <div className="usage-item">
                <div className="usage-header">
                  <Package size={20} />
                  <span>Productos</span>
                </div>
                {usageStats.products.unlimited ? (
                  <div className="usage-unlimited">
                    <span className="unlimited-icon">∞</span>
                    <span>Ilimitado</span>
                  </div>
                ) : (
                  <>
                    <div className="usage-bar">
                      <div 
                        className="usage-bar-fill"
                        style={{ 
                          width: `${getUsagePercentage(usageStats.products.current, usageStats.products.limit)}%`,
                          background: getUsagePercentage(usageStats.products.current, usageStats.products.limit) > 90 
                            ? '#EF4444' 
                            : getUsagePercentage(usageStats.products.current, usageStats.products.limit) > 70
                              ? '#F59E0B'
                              : '#10B981'
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      <span>{usageStats.products.current} / {usageStats.products.limit}</span>
                      <span>{getUsagePercentage(usageStats.products.current, usageStats.products.limit)}%</span>
                    </div>
                  </>
                )}
              </div>

              {/* Ventas */}
              <div className="usage-item">
                <div className="usage-header">
                  <DollarSign size={20} />
                  <span>Ventas este mes</span>
                </div>
                {usageStats.sales.unlimited ? (
                  <div className="usage-unlimited">
                    <span className="unlimited-icon">∞</span>
                    <span>Ilimitado</span>
                  </div>
                ) : (
                  <>
                    <div className="usage-bar">
                      <div 
                        className="usage-bar-fill"
                        style={{ 
                          width: `${getUsagePercentage(usageStats.sales.current, usageStats.sales.limit)}%`,
                          background: getUsagePercentage(usageStats.sales.current, usageStats.sales.limit) > 90 
                            ? '#EF4444' 
                            : getUsagePercentage(usageStats.sales.current, usageStats.sales.limit) > 70
                              ? '#F59E0B'
                              : '#10B981'
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      <span>{usageStats.sales.current} / {usageStats.sales.limit}</span>
                      <span>{getUsagePercentage(usageStats.sales.current, usageStats.sales.limit)}%</span>
                    </div>
                  </>
                )}
              </div>

              {/* Usuarios */}
              <div className="usage-item">
                <div className="usage-header">
                  <Users size={20} />
                  <span>Miembros del equipo</span>
                </div>
                {usageStats.users.unlimited ? (
                  <div className="usage-unlimited">
                    <span className="unlimited-icon">∞</span>
                    <span>Ilimitado</span>
                  </div>
                ) : (
                  <>
                    <div className="usage-bar">
                      <div 
                        className="usage-bar-fill"
                        style={{ 
                          width: `${getUsagePercentage(usageStats.users.current, usageStats.users.limit)}%`,
                          background: getUsagePercentage(usageStats.users.current, usageStats.users.limit) > 90 
                            ? '#EF4444' 
                            : getUsagePercentage(usageStats.users.current, usageStats.users.limit) > 70
                              ? '#F59E0B'
                              : '#10B981'
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      <span>{usageStats.users.current} / {usageStats.users.limit}</span>
                      <span>{getUsagePercentage(usageStats.users.current, usageStats.users.limit)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Acciones */}
        {!isVIP && (
          <motion.div
            className="acciones-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isFreePlan ? (
              <div className="upgrade-section">
                <h3>Actualiza tu plan</h3>
                <p>Desbloquea todas las funcionalidades avanzadas</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/pricing')}
                >
                  Ver Planes
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="manage-section">
                <h3>Gestionar Suscripción</h3>
                <div className="action-buttons">
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate('/pricing')}
                  >
                    Cambiar Plan
                  </button>
                  {!isPendingCancellation && (
                    <button 
                      className="btn-danger"
                      onClick={() => setMostrarModalCancelar(true)}
                    >
                      Cancelar Suscripción
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal de Cancelación */}
      {mostrarModalCancelar && (
        <div className="modal-overlay" onClick={() => setMostrarModalCancelar(false)}>
          <motion.div 
            className="modal-cancelar"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="modal-header">
              <AlertCircle size={48} color="#EF4444" />
              <h2>¿Cancelar suscripción?</h2>
            </div>

            <div className="modal-body">
              <p>Lamentamos que te vayas. Tu suscripción seguirá activa hasta el final del período pagado.</p>
              
              <div className="form-group">
                <label>¿Por qué cancelas? (opcional)</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Cuéntanos por qué cancelas para mejorar nuestro servicio..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setMostrarModalCancelar(false)}
                disabled={cancelando}
              >
                Mantener Suscripción
              </button>
              <button 
                className="btn-danger"
                onClick={handleCancelarSuscripcion}
                disabled={cancelando}
              >
                {cancelando ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MiSuscripcion;
