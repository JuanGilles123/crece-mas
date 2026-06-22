// 🛡️ Componente para proteger features según el plan de suscripción
import React, { useEffect, useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import LottieLoader from './ui/LottieLoader';
import { getRequiredPlanForFeature, getFeatureName } from '../constants/subscriptionFeatures';
import DegradedPlanOverlay from './DegradedPlanOverlay';

const FeatureGuard = ({ 
  feature,          // Nombre de la feature a verificar (ej: 'productImages')
  action,           // Acción a verificar (ej: 'createProduct')
  children,         // Contenido a mostrar si tiene acceso
  fallback,         // Componente personalizado si no tiene acceso
  recommendedPlan = 'professional',  // Plan recomendado para upgrade
  showInline = false  // Mostrar como inline o como modal (por defecto: modal)
}) => {
  const { hasFeature, canPerformAction, loading, isDegraded } = useSubscription();
  const [canPerform, setCanPerform] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);

  // Verificar acciones asíncronas
  useEffect(() => {
    if (action) {
      canPerformAction(action).then(setCanPerform);
    }
  }, [action, canPerformAction]);

  // Mostrar loader mientras verifica
  if (loading) {
    return <LottieLoader />;
  }

  // Verificar feature booleana
  if (feature && !hasFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!modalOpen && !showInline) {
      return null;
    }

    const featureName = getFeatureName(feature);
    
    if (isDegraded) {
      return (
        <DegradedPlanOverlay 
          moduleName={featureName}
          forceBlock={true}
          description="Esta función fue suspendida porque tu plan está vencido."
        >
          {children}
        </DegradedPlanOverlay>
      );
    }

    const requiredPlan = recommendedPlan || getRequiredPlanForFeature(feature);
    const planName = requiredPlan === 'professional' ? 'Estándar' : requiredPlan === 'enterprise' ? 'Premium' : 'Estándar';

    if (showInline) {
      return (
        <UpgradePrompt 
          feature={feature}
          featureName={featureName}
          reason={`"${featureName}" está disponible en el plan ${planName}. Actualiza tu plan para acceder a esta función.`}
          recommendedPlan={requiredPlan}
          inline={true}
        />
      );
    }

    // Para vistas completas, mostrar contenido borroso detrás del prompt
    return (
      <div className="degraded-overlay-wrapper" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
        <div className="degraded-overlay-content-blurred" style={{ filter: 'blur(4px) grayscale(0.5)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>
        {modalOpen && (
          <UpgradePrompt 
            feature={feature}
            featureName={featureName}
            reason={`"${featureName}" está disponible en el plan ${planName}. Actualiza tu plan para acceder a esta función.`}
            recommendedPlan={requiredPlan}
            inline={false}
            onClose={() => setModalOpen(false)}
          />
        )}
        {!modalOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button 
              onClick={() => setModalOpen(true)}
              style={{ padding: '10px 20px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 600 }}
            >
              🔒 Ver Plan {planName}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Verificar acción con límites
  if (action) {
    if (canPerform === null) {
      return <LottieLoader />;
    }

    if (!canPerform.allowed) {
      if (fallback) {
        return <>{fallback}</>;
      }

      if (!modalOpen && !showInline) {
        return null; // Si el modal está cerrado y no es inline, no mostrar nada
      }
      
      if (isDegraded) {
        return (
          <DegradedPlanOverlay 
            moduleName="Límite alcanzado"
            forceBlock={true}
            description={canPerform.reason || "Has alcanzado el límite de tu plan actual vencido."}
          >
            {children}
          </DegradedPlanOverlay>
        );
      }

      if (showInline) {
        return (
          <UpgradePrompt 
            reason={canPerform.reason}
            recommendedPlan={recommendedPlan}
            inline={true}
          />
        );
      }

      return (
        <div className="degraded-overlay-wrapper" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
          <div className="degraded-overlay-content-blurred" style={{ filter: 'blur(4px) grayscale(0.5)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}>
            {children}
          </div>
          {modalOpen && (
            <UpgradePrompt 
              reason={canPerform.reason}
              recommendedPlan={recommendedPlan}
              inline={false}
              onClose={() => setModalOpen(false)}
            />
          )}
          {!modalOpen && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button 
                onClick={() => setModalOpen(true)}
                style={{ padding: '10px 20px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 600 }}
              >
                🔒 Límite Alcanzado
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  // Si tiene acceso, mostrar el contenido
  return <>{children}</>;
};

export default FeatureGuard;
