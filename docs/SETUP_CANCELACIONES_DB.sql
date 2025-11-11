-- ===================================
-- TABLA DE CANCELACIONES DE SUSCRIPCIONES
-- ===================================

-- Tabla para registrar motivos de cancelación y feedback
CREATE TABLE IF NOT EXISTS public.subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  cancelled_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  cancellation_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_cancellations_org ON public.subscription_cancellations(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_cancellations_date ON public.subscription_cancellations(cancellation_date);

-- RLS Policies
ALTER TABLE public.subscription_cancellations ENABLE ROW LEVEL SECURITY;

-- Los owners pueden ver las cancelaciones de su organización
CREATE POLICY "subscription_cancellations_select_policy"
ON public.subscription_cancellations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = subscription_cancellations.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- Los owners pueden insertar cancelaciones
CREATE POLICY "subscription_cancellations_insert_policy"
ON public.subscription_cancellations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = subscription_cancellations.organization_id
    AND organizations.owner_id = auth.uid()
  )
);

-- ===================================
-- COMENTARIOS
-- ===================================

COMMENT ON TABLE public.subscription_cancellations IS 'Registro de cancelaciones de suscripciones con motivos de feedback';
COMMENT ON COLUMN public.subscription_cancellations.reason IS 'Motivo de cancelación proporcionado por el usuario';
COMMENT ON COLUMN public.subscription_cancellations.cancelled_by IS 'Usuario que realizó la cancelación';
