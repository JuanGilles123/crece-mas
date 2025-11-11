import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  TrendingUp, 
  Users, 
  Building2,
  ArrowLeft,
  Crown,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import LottieLoader from '../components/LottieLoader';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { planSlug, planName, loading, isVIP } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly | yearly
  const [processingPlan, setProcessingPlan] = useState(null); // Para mostrar loading en el botón

  const plans = [
    {
      name: 'Gratis',
      slug: 'free',
      description: 'Perfecto para empezar tu negocio',
      price: 0,
      priceYearly: 0,
      icon: Sparkles,
      color: '#8B5CF6',
      features: [
        { name: '1 organización', included: true },
        { name: '1 usuario', included: true },
        { name: 'Hasta 20 productos', included: true },
        { name: 'Hasta 50 ventas/mes', included: true },
        { name: 'Historial de 7 días', included: true },
        { name: 'Inventario básico', included: true },
        { name: 'Venta rápida', included: true },
        { name: 'Caja registradora', included: true },
        { name: 'Dashboard básico', included: true },
        { name: 'Sin imágenes de productos', included: false },
        { name: 'Sin importar CSV', included: false },
        { name: 'Sin exportar datos', included: false },
        { name: 'Sin equipo', included: false },
      ],
      recommended: false,
      cta: 'Plan Actual',
      ctaAction: 'current'
    },
    {
      name: 'Profesional',
      slug: 'professional',
      description: 'Para negocios en crecimiento',
      price: 60000,
      priceYearly: 600000,
      savings: '2 meses gratis',
      icon: Zap,
      color: '#3B82F6',
      features: [
        { name: '1 organización', included: true },
        { name: 'Hasta 10 usuarios', included: true },
        { name: 'Productos ilimitados', included: true },
        { name: 'Ventas ilimitadas', included: true },
        { name: 'Historial completo', included: true },
        { name: 'Imágenes de productos', included: true },
        { name: 'Importar/Exportar CSV', included: true },
        { name: 'Operaciones masivas', included: true },
        { name: 'Múltiples métodos de pago', included: true },
        { name: 'Pagos mixtos', included: true },
        { name: 'Reportes avanzados', included: true },
        { name: 'Gestión de equipo', included: true },
        { name: 'Roles y permisos', included: true },
        { name: 'Configuración de facturas', included: true },
        { name: 'Notificaciones', included: true },
        { name: 'Soporte por email', included: true },
      ],
      recommended: true,
      cta: 'Actualizar a Profesional',
      ctaAction: 'upgrade'
    },
    {
      name: 'Empresarial',
      slug: 'enterprise',
      description: 'Para empresas con múltiples sucursales',
      price: 150000,
      priceYearly: 1500000,
      savings: '2 meses gratis',
      icon: Building2,
      color: '#10B981',
      features: [
        { name: 'Hasta 5 organizaciones', included: true },
        { name: 'Usuarios ilimitados', included: true },
        { name: 'Todo del plan Profesional', included: true },
        { name: 'Multi-organización', included: true },
        { name: 'Transferencias entre sucursales', included: true },
        { name: 'Reportes consolidados', included: true },
        { name: 'API de integración', included: true },
        { name: 'Marca personalizada', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'WhatsApp directo', included: true },
        { name: 'Onboarding personalizado', included: true },
      ],
      recommended: false,
      cta: 'Actualizar a Empresarial',
      ctaAction: 'upgrade'
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = async (plan) => {
    if (isVIP) {
      toast('Tienes acceso VIP ilimitado', { icon: '👑' });
      return;
    }

    if (plan.slug === planSlug) {
      toast('Ya estás en este plan', { icon: '✅' });
      return;
    }

    if (plan.slug === 'free') {
      toast.error('No puedes cambiar al plan gratuito desde aquí');
      return;
    }

    try {
      setProcessingPlan(plan.slug);

      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Debes iniciar sesión');
        navigate('/login');
        return;
      }

      // Obtener el plan_id de la base de datos usando el slug
      const { data: dbPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', plan.slug)
        .single();

      if (planError || !dbPlan) {
        toast.error('Error al obtener información del plan');
        console.error('Plan error:', planError);
        return;
      }

      // Crear checkout en Wompi vía Edge Function usando fetch directo
      console.log('Enviando a checkout:', { 
        plan_id: dbPlan.id, 
        billing_period: billingPeriod,
        plan: plan 
      });
      
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            plan_id: dbPlan.id,
            billing_period: billingPeriod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Error del servidor:', data);
        throw new Error(data.error || data.details || 'Error al crear checkout');
      }

      console.log('✅ Respuesta exitosa del servidor:', data);

      // Redirigir a Wompi
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        console.error('❌ No hay checkout_url en la respuesta:', data);
        throw new Error('No se recibió URL de checkout');
      }

    } catch (error) {
      console.error('Error en handleSelectPlan:', error);
      toast.error(error.message || 'Error al procesar el pago');
      setProcessingPlan(null);
    }
  };

  // Función de prueba para simular pago exitoso
  const handleTestPayment = async (plan) => {
    try {
      setProcessingPlan(plan.slug);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes iniciar sesión');
        return;
      }

      // Obtener plan de BD
      const { data: dbPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', plan.slug)
        .single();

      // Obtener organization_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

      console.log('🧪 Simulando pago para:', { plan: plan.name, billing: billingPeriod });

      // Llamar a función de prueba
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/test-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            plan_id: dbPlan.id,
            billing_period: billingPeriod,
            organization_id: profile.organization_id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Pago simulado exitosamente! Suscripción activada');
        navigate('/subscription/success?test=true');
      } else {
        toast.error(data.message || 'Error al simular pago');
      }

      setProcessingPlan(null);
    } catch (error) {
      console.error('Error en test payment:', error);
      toast.error('Error al simular pago');
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="pricing-loading">
        <LottieLoader size="large" message="Cargando planes..." />
      </div>
    );
  }

  return (
    <div className="pricing-page">
      {/* Header */}
      <div className="pricing-header">
        <button className="pricing-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Volver
        </button>
        
        <motion.div
          className="pricing-title-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="pricing-title">
            <Crown className="pricing-title-icon" />
            Elige el plan perfecto para tu negocio
          </h1>
          <p className="pricing-subtitle">
            Sin permanencia. Cancela cuando quieras. Actualiza o degrada en cualquier momento.
          </p>
        </motion.div>

        {/* Billing Cycle Toggle */}
        <motion.div
          className="billing-toggle"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className={`billing-option ${billingPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Mensual
          </button>
          <button
            className={`billing-option ${billingPeriod === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('yearly')}
          >
            Anual
            <span className="savings-badge">Ahorra 17%</span>
          </button>
        </motion.div>

        {/* Current Plan Badge */}
        {!loading && (
          <motion.div
            className="current-plan-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Plan actual: <strong>{planName || 'Gratis'}</strong>
          </motion.div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="pricing-plans-grid">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.slug === planSlug;
          const displayPrice = billingPeriod === 'yearly' ? plan.priceYearly : plan.price;
          const monthlyEquivalent = billingPeriod === 'yearly' ? plan.priceYearly / 12 : null;

          return (
            <motion.div
              key={plan.slug}
              className={`pricing-card ${plan.recommended ? 'recommended' : ''} ${isCurrentPlan ? 'current' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              {plan.recommended && (
                <div className="recommended-badge">
                  <TrendingUp size={14} />
                  Más Popular
                </div>
              )}

              {isCurrentPlan && (
                <div className="current-badge">
                  <Check size={14} />
                  Plan Actual
                </div>
              )}

              <div className="plan-icon" style={{ background: `${plan.color}15` }}>
                <Icon size={32} color={plan.color} />
              </div>

              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>

              <div className="plan-price">
                <span className="price-amount">{formatPrice(displayPrice)}</span>
                <span className="price-period">
                  {displayPrice === 0 ? 'para siempre' : `/ ${billingPeriod === 'yearly' ? 'año' : 'mes'}`}
                </span>
              </div>

              {monthlyEquivalent && (
                <div className="price-equivalent">
                  ≈ {formatPrice(monthlyEquivalent)}/mes
                </div>
              )}

              {billingPeriod === 'yearly' && plan.savings && displayPrice > 0 && (
                <div className="savings-info">
                  🎉 {plan.savings}
                </div>
              )}

              <button
                className={`plan-cta ${isCurrentPlan ? 'current' : ''} ${processingPlan === plan.slug ? 'processing' : ''}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || processingPlan !== null}
              >
                {processingPlan === plan.slug ? (
                  <>
                    <div className="spinner" />
                    Procesando...
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <Check size={18} />
                    Plan Actual
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    {plan.cta}
                  </>
                )}
              </button>

              {/* Botón de prueba (solo en desarrollo) */}
              {!isCurrentPlan && plan.slug !== 'free' && process.env.NODE_ENV === 'development' && (
                <button
                  className="plan-cta-test"
                  onClick={() => handleTestPayment(plan)}
                  disabled={processingPlan !== null}
                  style={{
                    marginTop: '10px',
                    background: '#10b981',
                    fontSize: '0.9em',
                  }}
                >
                  🧪 Simular Pago (Test)
                </button>
              )}

              <div className="plan-features">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className={`feature-item ${!feature.included ? 'not-included' : ''}`}
                  >
                    {feature.included ? (
                      <Check size={16} className="feature-icon included" />
                    ) : (
                      <X size={16} className="feature-icon not-included" />
                    )}
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <motion.div
        className="pricing-faq"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="faq-title">Preguntas Frecuentes</h2>
        
        <div className="faq-grid">
          <div className="faq-item">
            <h3>¿Puedo cambiar de plan en cualquier momento?</h3>
            <p>Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se reflejan inmediatamente.</p>
          </div>

          <div className="faq-item">
            <h3>¿Qué pasa si supero los límites del plan gratuito?</h3>
            <p>Te notificaremos cuando estés cerca del límite. No podrás agregar más productos o ventas hasta que actualices tu plan.</p>
          </div>

          <div className="faq-item">
            <h3>¿Hay período de prueba?</h3>
            <p>Sí, todos los planes pagos incluyen 14 días de prueba gratis. No se requiere tarjeta de crédito para empezar.</p>
          </div>

          <div className="faq-item">
            <h3>¿Cómo funciona la facturación anual?</h3>
            <p>Pagas por adelantado y ahorras el equivalente a 2 meses gratis. Puedes cancelar en cualquier momento.</p>
          </div>

          <div className="faq-item">
            <h3>¿Qué métodos de pago aceptan?</h3>
            <p>Aceptamos todas las tarjetas de crédito y débito, PSE, y transferencias bancarias a través de Wompi.</p>
          </div>

          <div className="faq-item">
            <h3>¿Ofrecen soporte técnico?</h3>
            <p>El plan Profesional incluye soporte por email. El plan Empresarial incluye soporte prioritario y WhatsApp directo.</p>
          </div>
        </div>
      </motion.div>

      {/* CTA Footer */}
      <motion.div
        className="pricing-cta-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2>¿Necesitas un plan personalizado?</h2>
        <p>Si tienes necesidades específicas o más de 5 organizaciones, contáctanos.</p>
        <button className="contact-btn">
          <Users size={20} />
          Contactar Ventas
        </button>
      </motion.div>
    </div>
  );
};

export default Pricing;
