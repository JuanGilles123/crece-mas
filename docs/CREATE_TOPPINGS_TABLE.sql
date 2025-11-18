-- 🍔 Crear tabla de toppings para negocios de comida
-- Ejecutar con: npm run setup-toppings o ./setup-toppings.sh

-- Crear tabla si no existe (PRIMERO)
CREATE TABLE IF NOT EXISTS toppings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT toppings_organization_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_toppings_organization ON toppings(organization_id);
CREATE INDEX IF NOT EXISTS idx_toppings_activo ON toppings(organization_id, activo) WHERE activo = true;

-- Habilitar RLS
ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para poder recrearlas)
-- Esto debe hacerse DESPUÉS de crear la tabla
DROP POLICY IF EXISTS "Users can view toppings from their organization" ON toppings;
DROP POLICY IF EXISTS "Owners and admins can insert toppings" ON toppings;
DROP POLICY IF EXISTS "Owners and admins can update toppings" ON toppings;
DROP POLICY IF EXISTS "Owners and admins can delete toppings" ON toppings;

-- Policy: CUALQUIER usuario de la organización puede VER toppings (para usarlos en ventas)
CREATE POLICY "Users can view toppings from their organization"
  ON toppings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Solo owners/admins pueden CREAR toppings
CREATE POLICY "Owners and admins can insert toppings"
  ON toppings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Solo owners/admins pueden ACTUALIZAR toppings (incluyendo stock e imágenes)
CREATE POLICY "Owners and admins can update toppings"
  ON toppings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Solo owners/admins pueden ELIMINAR toppings
CREATE POLICY "Owners and admins can delete toppings"
  ON toppings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_toppings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_toppings_timestamp
  BEFORE UPDATE ON toppings
  FOR EACH ROW
  EXECUTE FUNCTION update_toppings_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE toppings IS 'Toppings (ingredientes adicionales) para negocios de comida';
COMMENT ON COLUMN toppings.organization_id IS 'ID de la organización propietaria';
COMMENT ON COLUMN toppings.nombre IS 'Nombre del topping';
COMMENT ON COLUMN toppings.precio IS 'Precio adicional del topping';
COMMENT ON COLUMN toppings.stock IS 'Cantidad disponible en stock';
COMMENT ON COLUMN toppings.imagen_url IS 'Ruta de la imagen del topping en storage (opcional)';
COMMENT ON COLUMN toppings.activo IS 'Si el topping está activo y disponible';

