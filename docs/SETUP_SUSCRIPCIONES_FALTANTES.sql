-- ============================================
-- COMPLETAR SISTEMA DE SUSCRIPCIONES
-- Solo agrega tablas y datos faltantes
-- ============================================

-- 2. Tabla de Suscripciones (si no existe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  wompi_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT status_check CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete'))
);

-- 3. Tabla de Pagos (si no existe)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  billing_period TEXT,
  wompi_transaction_id TEXT UNIQUE,
  wompi_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payment_status_check CHECK (status IN ('pending', 'approved', 'declined', 'voided', 'error'))
);

-- 4. Tabla de Seguimiento de Uso (si no existe)
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

-- Índices (solo si no existen)
DO $$ 
BEGIN
  -- Índices para subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_organization') THEN
    CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_plan') THEN
    CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_status') THEN
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_wompi') THEN
    CREATE INDEX idx_subscriptions_wompi ON subscriptions(wompi_subscription_id);
  END IF;

  -- Índices para payments
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_subscription') THEN
    CREATE INDEX idx_payments_subscription ON payments(subscription_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_organization') THEN
    CREATE INDEX idx_payments_organization ON payments(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
    CREATE INDEX idx_payments_status ON payments(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_wompi_transaction') THEN
    CREATE INDEX idx_payments_wompi_transaction ON payments(wompi_transaction_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_date') THEN
    CREATE INDEX idx_payments_date ON payments(payment_date);
  END IF;

  -- Índices para usage_tracking
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usage_tracking_organization') THEN
    CREATE INDEX idx_usage_tracking_organization ON usage_tracking(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usage_tracking_period') THEN
    CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
  END IF;
END $$;

-- 5. Modificar tabla organizations (agregar columnas de suscripción si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_id') THEN
    ALTER TABLE organizations ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_status') THEN
    ALTER TABLE organizations ADD COLUMN subscription_status TEXT DEFAULT 'free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_trial_used') THEN
    ALTER TABLE organizations ADD COLUMN is_trial_used BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Índices para organizations (solo si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_subscription') THEN
    CREATE INDEX idx_organizations_subscription ON organizations(subscription_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_subscription_status') THEN
    CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
  END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas (si no está habilitado)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen y recrearlas
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia suscripción" ON subscriptions;
DROP POLICY IF EXISTS "Solo owners y admins pueden insertar suscripciones" ON subscriptions;
DROP POLICY IF EXISTS "Solo owners y admins pueden actualizar suscripciones" ON subscriptions;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios pagos" ON payments;
DROP POLICY IF EXISTS "Solo owners y admins pueden ver todos los pagos de su organización" ON payments;
DROP POLICY IF EXISTS "Los usuarios pueden ver el uso de su organización" ON usage_tracking;

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
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en subscriptions (solo si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- COMPLETADO
-- ============================================

SELECT 'Setup completado exitosamente' AS status;
