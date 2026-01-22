-- Sistema de Clientes
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. TABLA: clientes
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  documento VARCHAR(50), -- Cédula, NIT, etc.
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_organization ON clientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(organization_id, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(organization_id, nombre);

-- Índice único parcial para documento (solo cuando documento no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_documento_unique 
  ON clientes(organization_id, documento) 
  WHERE documento IS NOT NULL;

-- RLS Policies
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver clientes de su organización
CREATE POLICY "Usuarios pueden ver clientes de su organización"
  ON clientes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Política: Usuarios pueden insertar clientes en su organización
CREATE POLICY "Usuarios pueden insertar clientes en su organización"
  ON clientes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Política: Usuarios pueden actualizar clientes de su organización
CREATE POLICY "Usuarios pueden actualizar clientes de su organización"
  ON clientes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Política: Usuarios pueden eliminar clientes de su organización
CREATE POLICY "Usuarios pueden eliminar clientes de su organización"
  ON clientes FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- 2. AGREGAR COLUMNA cliente_id A ventas
-- ============================================
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);

-- ============================================
-- 3. COMENTARIOS
-- ============================================
COMMENT ON TABLE clientes IS 'Clientes registrados en el sistema';
COMMENT ON COLUMN clientes.documento IS 'Documento de identidad (cédula, NIT, etc.)';
COMMENT ON COLUMN clientes.activo IS 'Indica si el cliente está activo o ha sido desactivado';
