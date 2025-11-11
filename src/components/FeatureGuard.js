// 🛡️ Componente para proteger features según el plan de suscripción
import React, { useEffect, useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import LottieLoader from './LottieLoader';

const FeatureGuard = ({ 
  feature,          // Nombre de la feature a verificar (ej: 'productImages')
  action,           // Acción a verificar (ej: 'createProduct')
  children,         // Contenido a mostrar si tiene acceso
  fallback,         // Componente personalizado si no tiene acceso
  recommendedPlan = 'professional',  // Plan recomendado para upgrade
  showInline = true  // Mostrar como inline o como bloqueador total
}) => {
  const { hasFeature, canPerformAction, loading } = useSubscription();
  const [canPerform, setCanPerform] = useState(null);

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

    return (
      <UpgradePrompt 
        feature={feature}
        reason={`Esta función requiere el plan ${recommendedPlan === 'professional' ? 'Profesional' : 'Empresarial'}`}
        recommendedPlan={recommendedPlan}
        inline={showInline}
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

      return (
        <UpgradePrompt 
          reason={canPerform.reason}
          recommendedPlan={recommendedPlan}
          inline={showInline}
        />
      );
    }
  }

  // Si tiene acceso, mostrar el contenido
  return <>{children}</>;
};

export default FeatureGuard;
