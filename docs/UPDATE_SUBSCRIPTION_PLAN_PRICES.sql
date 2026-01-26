-- Script para actualizar los precios de los planes de suscripción
-- Precios correctos según PLAN_PRICES en subscriptionFeatures.js

-- Actualizar plan Estándar (professional)
UPDATE subscription_plans
SET 
  price_monthly = 69900,
  price_yearly = 699000
WHERE slug = 'professional';

-- Actualizar plan Premium (enterprise)
UPDATE subscription_plans
SET 
  price_monthly = 119900,
  price_yearly = 1199000
WHERE slug = 'enterprise';

-- Verificar los precios actualizados
SELECT 
  id,
  name,
  slug,
  price_monthly,
  price_yearly,
  created_at,
  updated_at
FROM subscription_plans
ORDER BY 
  CASE slug
    WHEN 'free' THEN 1
    WHEN 'professional' THEN 2
    WHEN 'enterprise' THEN 3
    WHEN 'custom' THEN 4
  END;
