-- 🎯 Script para crear la tabla de variaciones centralizadas
-- Similar a toppings, pero para opciones de personalización de productos

CREATE TABLE IF NOT EXISTS variaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'select', -- 'select' o 'checkbox'
  requerido BOOLEAN DEFAULT false,
  opciones JSONB DEFAULT '[]'::jsonb, -- Array de opciones para tipo 'select'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT variaciones_organization_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT variaciones_tipo_check CHECK (tipo IN ('select', 'checkbox'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_variaciones_organization ON variaciones(organization_id);
CREATE INDEX IF NOT EXISTS idx_variaciones_activo ON variaciones(organization_id, activo) WHERE activo = true;

-- RLS Policies
ALTER TABLE variaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para poder recrearlas)
DROP POLICY IF EXISTS "Users can view variaciones from their organization" ON variaciones;
DROP POLICY IF EXISTS "Users with inventory permission can insert variaciones" ON variaciones;
DROP POLICY IF EXISTS "Users with inventory permission can update variaciones" ON variaciones;
DROP POLICY IF EXISTS "Users with inventory permission can delete variaciones" ON variaciones;

-- Política para que los usuarios solo vean las variaciones de su organización
CREATE POLICY "Users can view variaciones from their organization"
  ON variaciones FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Política para que los usuarios con permisos de inventario puedan insertar
CREATE POLICY "Users with inventory permission can insert variaciones"
  ON variaciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Política para que los usuarios con permisos de inventario puedan actualizar
CREATE POLICY "Users with inventory permission can update variaciones"
  ON variaciones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Política para que los usuarios con permisos de inventario puedan eliminar
CREATE POLICY "Users with inventory permission can delete variaciones"
  ON variaciones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = variaciones.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_variaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_variaciones_timestamp
  BEFORE UPDATE ON variaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_variaciones_updated_at();

-- Comentarios
COMMENT ON TABLE variaciones IS 'Variaciones centralizadas que pueden ser vinculadas a productos';
COMMENT ON COLUMN variaciones.nombre IS 'Nombre de la variación (ej: "Salsa", "Arequipe")';
COMMENT ON COLUMN variaciones.tipo IS 'Tipo de variación: "select" (selección única) o "checkbox" (sí/no)';
COMMENT ON COLUMN variaciones.requerido IS 'Si la variación es requerida para el producto';
COMMENT ON COLUMN variaciones.opciones IS 'Array de opciones para tipo "select" (ej: [{"valor": "mora", "label": "Mora"}, {"valor": "melocoton", "label": "Melocotón"}])';
