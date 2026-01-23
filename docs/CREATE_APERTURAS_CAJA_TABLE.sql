-- Sistema de Aperturas de Caja
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- TABLA: aperturas_caja
-- ============================================
CREATE TABLE IF NOT EXISTS aperturas_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monto_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  cierre_id UUID REFERENCES cierres_caja(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Una organización solo puede tener una caja abierta a la vez
  -- (verificado a nivel de aplicación, no con constraint único)
  CONSTRAINT aperturas_caja_organization_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- Índices para aperturas_caja
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_organization ON aperturas_caja(organization_id);
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_user ON aperturas_caja(user_id);
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_estado ON aperturas_caja(organization_id, estado) WHERE estado = 'abierta';
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_cierre ON aperturas_caja(cierre_id) WHERE cierre_id IS NOT NULL;

-- RLS Policies
ALTER TABLE aperturas_caja ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver aperturas de su organización
DROP POLICY IF EXISTS "Users can view aperturas of their organization" ON aperturas_caja;
CREATE POLICY "Users can view aperturas of their organization"
  ON aperturas_caja
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Política: Los usuarios pueden crear aperturas en su organización
DROP POLICY IF EXISTS "Users can create aperturas in their organization" ON aperturas_caja;
CREATE POLICY "Users can create aperturas in their organization"
  ON aperturas_caja
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND organization_id = aperturas_caja.organization_id
      )
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND organization_id = aperturas_caja.organization_id
        AND status = 'active'
      )
    )
    AND user_id = auth.uid()
  );

-- Política: Los usuarios pueden actualizar aperturas de su organización
DROP POLICY IF EXISTS "Users can update aperturas of their organization" ON aperturas_caja;
CREATE POLICY "Users can update aperturas of their organization"
  ON aperturas_caja
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE aperturas_caja IS 'Registro de aperturas de caja. Cada apertura debe tener un cierre asociado.';
COMMENT ON COLUMN aperturas_caja.monto_inicial IS 'Monto inicial con el que se abre la caja';
COMMENT ON COLUMN aperturas_caja.estado IS 'Estado de la apertura: abierta o cerrada';
COMMENT ON COLUMN aperturas_caja.cierre_id IS 'ID del cierre de caja asociado. NULL si la caja está abierta';
