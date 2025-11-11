-- ============================================
-- SISTEMA DE SUSCRIPCIONES - CRECE+
-- Script SQL SEGURO (maneja objetos existentes)
-- ============================================

-- 1. Tabla de Planes de Suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2),
  currency TEXT DEFAULT 'COP',
  max_organizations INTEGER,
  max_users_per_org INTEGER,
  max_products INTEGER,
  max_sales_per_month INTEGER,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para subscription_plans (DROP IF EXISTS primero)
DROP INDEX IF EXISTS idx_subscription_plans_slug;
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);

DROP INDEX IF EXISTS idx_subscription_plans_active;
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- 2. Verificar/Recrear tabla de Suscripciones
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  wompi_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT status_check CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete'))
);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_wompi ON subscriptions(wompi_subscription_id);

-- 3. Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  wompi_transaction_id TEXT UNIQUE,
  wompi_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payment_status_check CHECK (status IN ('pending', 'approved', 'declined', 'voided', 'error'))
);

-- Índices para payments (DROP IF EXISTS primero)
DROP INDEX IF EXISTS idx_payments_subscription;
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

DROP INDEX IF EXISTS idx_payments_organization;
CREATE INDEX idx_payments_organization ON payments(organization_id);

DROP INDEX IF EXISTS idx_payments_status;
CREATE INDEX idx_payments_status ON payments(status);

DROP INDEX IF EXISTS idx_payments_wompi_transaction;
CREATE INDEX idx_payments_wompi_transaction ON payments(wompi_transaction_id);

DROP INDEX IF EXISTS idx_payments_date;
CREATE INDEX idx_payments_date ON payments(payment_date);

-- 4. Tabla de Seguimiento de Uso
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  products_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start)
);

-- Índices para usage_tracking (DROP IF EXISTS primero)
DROP INDEX IF EXISTS idx_usage_tracking_organization;
CREATE INDEX idx_usage_tracking_organization ON usage_tracking(organization_id);

DROP INDEX IF EXISTS idx_usage_tracking_period;
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- 5. Modificar tabla organizations (agregar columnas de suscripción)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_used BOOLEAN DEFAULT false;

-- Índice para organizations (DROP IF EXISTS primero)
DROP INDEX IF EXISTS idx_organizations_subscription;
CREATE INDEX idx_organizations_subscription ON organizations(subscription_id);

DROP INDEX IF EXISTS idx_organizations_subscription_status;
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);

-- ============================================
-- DATOS SEED - PLANES DE SUSCRIPCIÓN
-- ============================================

INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_organizations, max_users_per_org, max_products, max_sales_per_month, features, display_order)
VALUES 
  (
    'Gratis',
    'free',
    0,
    0,
    1,
    1,
    20,
    50,
    '["inventoryBasic", "quickSale", "cashRegister", "basicDashboard", "salesHistory"]'::jsonb,
    1
  ),
  (
    'Profesional',
    'professional',
    60000,
    600000,
    1,
    10,
    NULL,
    NULL,
    '["inventoryBasic", "inventoryAdvanced", "productImages", "importCSV", "exportData", "bulkOperations", "quickSale", "advancedSale", "multiplePaymentMethods", "mixedPayments", "salesHistory", "salesReports", "cashRegister", "cashRegisterReports", "closingHistory", "teamManagement", "rolesAndPermissions", "inviteUsers", "basicDashboard", "advancedReports", "charts", "metrics", "taxConfiguration", "invoiceCustomization", "notifications", "emailSupport"]'::jsonb,
    2
  ),
  (
    'Empresarial',
    'enterprise',
    150000,
    1500000,
    5,
    NULL,
    NULL,
    NULL,
    '["inventoryBasic", "inventoryAdvanced", "productImages", "importCSV", "exportData", "bulkOperations", "quickSale", "advancedSale", "multiplePaymentMethods", "mixedPayments", "salesHistory", "salesReports", "cashRegister", "cashRegisterReports", "closingHistory", "teamManagement", "rolesAndPermissions", "inviteUsers", "basicDashboard", "advancedReports", "charts", "metrics", "taxConfiguration", "invoiceCustomization", "notifications", "emailSupport", "prioritySupport", "multiOrg", "branchTransfers", "consolidatedReports", "apiAccess", "customBranding", "whatsappSupport", "onboarding"]'::jsonb,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes primero
DROP POLICY IF EXISTS "Los planes son públicos para lectura" ON subscription_plans;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia suscripción" ON subscriptions;
DROP POLICY IF EXISTS "Solo owners y admins pueden insertar suscripciones" ON subscriptions;
DROP POLICY IF EXISTS "Solo owners y admins pueden actualizar suscripciones" ON subscriptions;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios pagos" ON payments;
DROP POLICY IF EXISTS "Solo owners y admins pueden ver todos los pagos de su organización" ON payments;
DROP POLICY IF EXISTS "Los usuarios pueden ver el uso de su organización" ON usage_tracking;

-- Políticas para subscription_plans (todos pueden leer los planes públicos)
CREATE POLICY "Los planes son públicos para lectura"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas para subscriptions
CREATE POLICY "Los usuarios pueden ver su propia suscripción"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Solo owners y admins pueden insertar suscripciones"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = subscriptions.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = subscriptions.organization_id
      AND team_members.role = 'Administrador'
      AND team_members.status = 'active'
    )
  );

CREATE POLICY "Solo owners y admins pueden actualizar suscripciones"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = subscriptions.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = subscriptions.organization_id
      AND team_members.role = 'Administrador'
      AND team_members.status = 'active'
    )
  );

-- Políticas para payments
CREATE POLICY "Los usuarios pueden ver sus propios pagos"
  ON payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Solo owners y admins pueden ver todos los pagos de su organización"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = payments.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = payments.organization_id
      AND team_members.role = 'Administrador'
      AND team_members.status = 'active'
    )
  );

-- Políticas para usage_tracking
CREATE POLICY "Los usuarios pueden ver el uso de su organización"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar triggers existentes primero
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular el uso mensual
CREATE OR REPLACE FUNCTION calculate_monthly_usage(org_id UUID)
RETURNS TABLE (
  products_count INTEGER,
  sales_count INTEGER,
  users_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM products WHERE organization_id = org_id),
    (SELECT COUNT(*)::INTEGER FROM sales 
     WHERE organization_id = org_id 
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
    (SELECT COUNT(*)::INTEGER FROM team_members 
     WHERE organization_id = org_id 
     AND status = 'active') + 1; -- +1 por el dueño
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Tablas creadas:' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'subscriptions', 'payments', 'usage_tracking');

SELECT 'Planes insertados:' AS status;
SELECT name, slug, price_monthly FROM subscription_plans ORDER BY display_order;
