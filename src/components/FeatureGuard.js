// 🛡️ Componente para proteger features según el plan de suscripción
import React, { useEffect, useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import LottieLoader from './ui/LottieLoader';
import { getRequiredPlanForFeature, getFeatureName } from '../constants/subscriptionFeatures';

const FeatureGuard = ({ 
  feature,          // Nombre de la feature a verificar (ej: 'productImages')
  action,           // Acción a verificar (ej: 'createProduct')
  children,         // Contenido a mostrar si tiene acceso
  fallback,         // Componente personalizado si no tiene acceso
  recommendedPlan = 'professional',  // Plan recomendado para upgrade
  showInline = false  // Mostrar como inline o como modal (por defecto: modal)
}) => {
  const { hasFeature, canPerformAction, loading } = useSubscription();
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

    // Obtener el plan requerido para esta feature
    const requiredPlan = recommendedPlan || getRequiredPlanForFeature(feature);
    const featureName = getFeatureName(feature);
    const planName = requiredPlan === 'professional' ? 'Estándar' : requiredPlan === 'enterprise' ? 'Premium' : 'Estándar';

    if (!modalOpen && !showInline) {
      return null; // Si el modal está cerrado y no es inline, no mostrar nada
    }

    return (
      <UpgradePrompt 
        feature={feature}
        featureName={featureName}
        reason={`"${featureName}" está disponible en el plan ${planName}. Actualiza tu plan para acceder a esta función.`}
        recommendedPlan={requiredPlan}
        inline={showInline}
        onClose={showInline ? undefined : () => setModalOpen(false)}
      />
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

      return (
        <UpgradePrompt 
          reason={canPerform.reason}
          recommendedPlan={recommendedPlan}
          inline={showInline}
          onClose={showInline ? undefined : () => setModalOpen(false)}
        />
      );
    }
  }

  // Si tiene acceso, mostrar el contenido
  return <>{children}</>;
};

export default FeatureGuard;
