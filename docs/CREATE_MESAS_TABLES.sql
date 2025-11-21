-- Sistema de Mesas y Pedidos para Restaurantes
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. TABLA: mesas
-- ============================================
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  numero VARCHAR(10) NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 4,
  estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento')),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, numero)
);

-- Índices para mesas
CREATE INDEX IF NOT EXISTS idx_mesas_organization ON mesas(organization_id);
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(organization_id, estado) WHERE activa = true;

-- ============================================
-- 2. TABLA: pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  numero_pedido VARCHAR(20) NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'completado', 'cancelado')),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  chef_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mesero_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completado_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(organization_id, numero_pedido)
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_organization ON pedidos(organization_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(organization_id, estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_chef ON pedidos(chef_id) WHERE chef_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_mesero ON pedidos(mesero_id);

-- ============================================
-- 3. TABLA: pedido_items
-- ============================================
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  toppings JSONB DEFAULT '[]'::jsonb,
  notas_item TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pedido_items
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto ON pedido_items(producto_id);

-- ============================================
-- 4. AGREGAR COLUMNAS A organizations
-- ============================================
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS mesas_habilitadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pedidos_habilitados BOOLEAN DEFAULT false;

-- ============================================
-- 5. HABILITAR RLS
-- ============================================
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLÍTICAS RLS PARA mesas
-- ============================================

-- Ver mesas de la organización
DROP POLICY IF EXISTS "Users can view mesas from their organization" ON mesas;
CREATE POLICY "Users can view mesas from their organization"
  ON mesas FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Crear mesas (solo owners/admins)
DROP POLICY IF EXISTS "Owners and admins can insert mesas" ON mesas;
CREATE POLICY "Owners and admins can insert mesas"
  ON mesas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Actualizar mesas (solo owners/admins)
DROP POLICY IF EXISTS "Owners and admins can update mesas" ON mesas;
CREATE POLICY "Owners and admins can update mesas"
  ON mesas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Eliminar mesas (solo owners/admins)
DROP POLICY IF EXISTS "Owners and admins can delete mesas" ON mesas;
CREATE POLICY "Owners and admins can delete mesas"
  ON mesas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = mesas.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 7. POLÍTICAS RLS PARA pedidos
-- ============================================

-- Ver pedidos de la organización
DROP POLICY IF EXISTS "Users can view pedidos from their organization" ON pedidos;
CREATE POLICY "Users can view pedidos from their organization"
  ON pedidos FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Crear pedidos (cualquier usuario activo)
DROP POLICY IF EXISTS "Active users can insert pedidos" ON pedidos;
CREATE POLICY "Active users can insert pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
      AND status = 'active'
    )
  );

-- Actualizar pedidos (cualquier usuario activo o chef asignado)
DROP POLICY IF EXISTS "Users can update pedidos" ON pedidos;
CREATE POLICY "Users can update pedidos"
  ON pedidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
      AND status = 'active'
    )
    OR pedidos.chef_id = auth.uid()
  );

-- Eliminar pedidos (solo owners/admins)
DROP POLICY IF EXISTS "Owners and admins can delete pedidos" ON pedidos;
CREATE POLICY "Owners and admins can delete pedidos"
  ON pedidos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = pedidos.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 8. POLÍTICAS RLS PARA pedido_items
-- ============================================

-- Ver items de pedidos de la organización
DROP POLICY IF EXISTS "Users can view pedido_items from their organization" ON pedido_items;
CREATE POLICY "Users can view pedido_items from their organization"
  ON pedido_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = pedido_items.pedido_id
      AND pedidos.organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Crear items (cualquier usuario activo)
DROP POLICY IF EXISTS "Active users can insert pedido_items" ON pedido_items;
CREATE POLICY "Active users can insert pedido_items"
  ON pedido_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = pedido_items.pedido_id
      AND pedidos.organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Actualizar items (cualquier usuario activo)
DROP POLICY IF EXISTS "Active users can update pedido_items" ON pedido_items;
CREATE POLICY "Active users can update pedido_items"
  ON pedido_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = pedido_items.pedido_id
      AND pedidos.organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Eliminar items (cualquier usuario activo)
DROP POLICY IF EXISTS "Active users can delete pedido_items" ON pedido_items;
CREATE POLICY "Active users can delete pedido_items"
  ON pedido_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = pedido_items.pedido_id
      AND pedidos.organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ============================================
-- 9. TRIGGERS PARA updated_at
-- ============================================

-- Trigger para mesas
CREATE OR REPLACE FUNCTION update_mesas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mesas_timestamp ON mesas;
CREATE TRIGGER update_mesas_timestamp
  BEFORE UPDATE ON mesas
  FOR EACH ROW
  EXECUTE FUNCTION update_mesas_updated_at();

-- Trigger para pedidos
CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pedidos_timestamp ON pedidos;
CREATE TRIGGER update_pedidos_timestamp
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_updated_at();

-- ============================================
-- 10. FUNCIÓN PARA GENERAR NÚMERO DE PEDIDO
-- ============================================

CREATE OR REPLACE FUNCTION generar_numero_pedido(org_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  ultimo_numero INTEGER;
  nuevo_numero VARCHAR(20);
BEGIN
  -- Obtener el último número de pedido de la organización
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 'PED-(\d+)') AS INTEGER)), 0)
  INTO ultimo_numero
  FROM pedidos
  WHERE organization_id = org_id;
  
  -- Generar nuevo número
  nuevo_numero := 'PED-' || LPAD((ultimo_numero + 1)::TEXT, 3, '0');
  
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. COMENTARIOS
-- ============================================

COMMENT ON TABLE mesas IS 'Mesas del restaurante';
COMMENT ON COLUMN mesas.numero IS 'Número de la mesa (ej: Mesa 1, Mesa 2)';
COMMENT ON COLUMN mesas.capacidad IS 'Número de personas que caben en la mesa';
COMMENT ON COLUMN mesas.estado IS 'Estado actual: disponible, ocupada, reservada, mantenimiento';

COMMENT ON TABLE pedidos IS 'Pedidos de clientes por mesa';
COMMENT ON COLUMN pedidos.numero_pedido IS 'Número único del pedido (ej: PED-001)';
COMMENT ON COLUMN pedidos.estado IS 'Estado: pendiente, en_preparacion, listo, completado, cancelado';
COMMENT ON COLUMN pedidos.chef_id IS 'Chef asignado al pedido (opcional)';

COMMENT ON TABLE pedido_items IS 'Items individuales de cada pedido';
COMMENT ON COLUMN pedido_items.toppings IS 'Array JSON de toppings seleccionados';

