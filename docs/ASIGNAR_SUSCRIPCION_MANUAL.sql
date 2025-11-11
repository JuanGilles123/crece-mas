-- ============================================
-- ASIGNAR SUSCRIPCIÓN MANUAL A ORGANIZACIÓN
-- ============================================

-- 1️⃣ Ver todas las organizaciones y sus suscripciones actuales
SELECT 
  o.id,
  o.name as "Organización",
  o.owner_email as "Owner",
  COALESCE(sp.name, 'Sin plan') as "Plan Actual",
  s.status as "Estado",
  s.current_period_end as "Vence"
FROM organizations o
LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY o.created_at DESC;

-- 2️⃣ Ver los planes disponibles
SELECT 
  id,
  slug,
  name,
  price_monthly,
  price_yearly
FROM subscription_plans
WHERE is_active = true
ORDER BY display_order;

-- 3️⃣ EJEMPLO: Asignar plan Profesional a una organización
-- Reemplaza 'ORGANIZATION_ID_AQUI' con el ID de la organización
-- Reemplaza 'PLAN_ID_AQUI' con el ID del plan que quieras asignar

/*
INSERT INTO subscriptions (
  organization_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
VALUES (
  'ORGANIZATION_ID_AQUI',  -- ID de la organización
  (SELECT id FROM subscription_plans WHERE slug = 'professional'), -- Plan Profesional
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'  -- Expira en 1 mes
)
ON CONFLICT (organization_id) 
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();
*/

-- 4️⃣ O usar el plan Empresarial:
/*
INSERT INTO subscriptions (
  organization_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
VALUES (
  'ORGANIZATION_ID_AQUI',  -- ID de la organización
  (SELECT id FROM subscription_plans WHERE slug = 'enterprise'), -- Plan Empresarial
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'  -- Expira en 1 año
)
ON CONFLICT (organization_id) 
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();
*/

-- 5️⃣ Verificar que se asignó correctamente
SELECT 
  o.name as "Organización",
  sp.name as "Plan",
  s.status as "Estado",
  s.current_period_start as "Inicio",
  s.current_period_end as "Fin"
FROM subscriptions s
JOIN organizations o ON o.id = s.organization_id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active';
