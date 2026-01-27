-- Sistema de Egresos - Gestión de Gastos, Proveedores y Órdenes de Compra
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. TABLA: proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(50),
  contacto_nombre VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  ciudad VARCHAR(100),
  pais VARCHAR(100) DEFAULT 'Colombia',
  tipo_proveedor VARCHAR(50), -- 'productos', 'servicios', 'insumos', 'otros'
  condiciones_pago TEXT, -- 'contado', '30_dias', '60_dias', etc.
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para proveedores
CREATE INDEX IF NOT EXISTS idx_proveedores_organization ON proveedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(organization_id, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(organization_id, nombre);

-- Índice único parcial para NIT (solo cuando no es NULL y no está vacío)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_nit_unique 
ON proveedores(organization_id, nit) 
WHERE nit IS NOT NULL AND nit != '';

-- ============================================
-- 2. TABLA: categorias_gastos
-- ============================================
CREATE TABLE IF NOT EXISTS categorias_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fijo', 'variable')),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, nombre, tipo)
);

-- Índices para categorias_gastos
CREATE INDEX IF NOT EXISTS idx_categorias_gastos_organization ON categorias_gastos(organization_id);
CREATE INDEX IF NOT EXISTS idx_categorias_gastos_tipo ON categorias_gastos(organization_id, tipo);

-- ============================================
-- 3. TABLA: gastos_fijos
-- ============================================
CREATE TABLE IF NOT EXISTS gastos_fijos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_gastos(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(10, 2) NOT NULL,
  frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
  dia_pago INTEGER, -- Día del mes (1-31) o día de la semana (1-7)
  metodo_pago VARCHAR(50) DEFAULT 'transferencia', -- 'efectivo', 'transferencia', 'tarjeta', 'cheque'
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE, -- NULL = sin fecha de finalización
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos_fijos
CREATE INDEX IF NOT EXISTS idx_gastos_fijos_organization ON gastos_fijos(organization_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fijos_activo ON gastos_fijos(organization_id, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_gastos_fijos_proveedor ON gastos_fijos(proveedor_id);

-- ============================================
-- 4. TABLA: ordenes_compra
-- ============================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  numero_orden VARCHAR(50) NOT NULL,
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'recibida', 'facturada', 'cancelada')),
  fecha_orden DATE NOT NULL,
  fecha_esperada DATE, -- Fecha esperada de entrega
  fecha_recibida DATE,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10, 2) DEFAULT 0,
  impuestos DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  condiciones_pago TEXT,
  notas TEXT,
  aprobado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aprobado_at TIMESTAMP WITH TIME ZONE,
  recibido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recibido_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- Usuario que creó la orden
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, numero_orden)
);

-- Índices para ordenes_compra
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_organization ON ordenes_compra(organization_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON ordenes_compra(organization_id, estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_fecha ON ordenes_compra(organization_id, fecha_orden DESC);

-- ============================================
-- 6. TABLA: orden_compra_items
-- ============================================
CREATE TABLE IF NOT EXISTS orden_compra_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto VARCHAR(255) NOT NULL, -- Nombre del producto al momento de crear la orden
  descripcion TEXT,
  cantidad DECIMAL(10, 2) NOT NULL,
  unidad_medida VARCHAR(20) DEFAULT 'unidad', -- 'unidad', 'kg', 'litro', 'metro', etc.
  precio_unitario DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  cantidad_recibida DECIMAL(10, 2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para orden_compra_items
CREATE INDEX IF NOT EXISTS idx_orden_compra_items_orden ON orden_compra_items(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_items_producto ON orden_compra_items(producto_id);

-- ============================================
-- 5. TABLA: gastos_variables
-- ============================================
CREATE TABLE IF NOT EXISTS gastos_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_gastos(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(10, 2) NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago VARCHAR(50) DEFAULT 'efectivo', -- 'efectivo', 'transferencia', 'tarjeta', 'cheque', 'credito'
  factura_numero VARCHAR(100),
  factura_fecha DATE,
  comprobante_url TEXT, -- URL del comprobante escaneado/subido
  notas TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos_variables
CREATE INDEX IF NOT EXISTS idx_gastos_variables_organization ON gastos_variables(organization_id);
CREATE INDEX IF NOT EXISTS idx_gastos_variables_fecha ON gastos_variables(organization_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_variables_proveedor ON gastos_variables(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_gastos_variables_orden_compra ON gastos_variables(orden_compra_id);

-- ============================================
-- 6. TABLA: creditos_proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS creditos_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE SET NULL,
  gasto_variable_id UUID REFERENCES gastos_variables(id) ON DELETE SET NULL,
  monto_total DECIMAL(10, 2) NOT NULL,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_pendiente DECIMAL(10, 2) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido', 'cancelado')),
  factura_numero VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_monto_pendiente_credito CHECK (monto_pendiente = monto_total - monto_pagado),
  CONSTRAINT check_monto_pagado_credito CHECK (monto_pagado >= 0 AND monto_pagado <= monto_total)
);

-- Índices para creditos_proveedores
CREATE INDEX IF NOT EXISTS idx_creditos_proveedores_organization ON creditos_proveedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_creditos_proveedores_proveedor ON creditos_proveedores(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_creditos_proveedores_estado ON creditos_proveedores(organization_id, estado);
CREATE INDEX IF NOT EXISTS idx_creditos_proveedores_vencimiento ON creditos_proveedores(organization_id, fecha_vencimiento) WHERE estado IN ('pendiente', 'parcial');

-- ============================================
-- 8. TABLA: pagos_proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS pagos_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credito_proveedor_id UUID NOT NULL REFERENCES creditos_proveedores(id) ON DELETE CASCADE,
  monto DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL DEFAULT 'transferencia', -- 'efectivo', 'transferencia', 'tarjeta', 'cheque'
  fecha_pago DATE NOT NULL,
  numero_comprobante VARCHAR(100),
  comprobante_url TEXT,
  notas TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pagos_proveedores
CREATE INDEX IF NOT EXISTS idx_pagos_proveedores_organization ON pagos_proveedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedores_credito ON pagos_proveedores(credito_proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedores_fecha ON pagos_proveedores(organization_id, fecha_pago DESC);

-- ============================================
-- 9. TRIGGERS Y FUNCIONES
-- ============================================

-- Función para actualizar monto_pendiente en creditos_proveedores
CREATE OR REPLACE FUNCTION update_credito_proveedor_monto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creditos_proveedores
  SET monto_pagado = (
    SELECT COALESCE(SUM(monto), 0)
    FROM pagos_proveedores
    WHERE credito_proveedor_id = NEW.credito_proveedor_id
  ),
  monto_pendiente = monto_total - (
    SELECT COALESCE(SUM(monto), 0)
    FROM pagos_proveedores
    WHERE credito_proveedor_id = NEW.credito_proveedor_id
  ),
  updated_at = NOW()
  WHERE id = NEW.credito_proveedor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar crédito cuando se inserta un pago
CREATE TRIGGER trigger_update_credito_proveedor_on_pago
  AFTER INSERT ON pagos_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_credito_proveedor_monto();

-- Función para actualizar estado del crédito
CREATE OR REPLACE FUNCTION update_credito_proveedor_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.monto_pendiente <= 0 THEN
    NEW.estado = 'pagado';
  ELSIF NEW.monto_pagado > 0 AND NEW.monto_pendiente > 0 THEN
    NEW.estado = 'parcial';
  ELSIF NEW.monto_pagado = 0 THEN
    NEW.estado = 'pendiente';
  END IF;
  
  -- Actualizar estado a vencido si la fecha de vencimiento pasó
  IF NEW.fecha_vencimiento IS NOT NULL AND NEW.fecha_vencimiento < CURRENT_DATE AND NEW.estado NOT IN ('pagado', 'cancelado') THEN
    NEW.estado = 'vencido';
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado
CREATE TRIGGER trigger_update_credito_proveedor_estado
  BEFORE INSERT OR UPDATE ON creditos_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_credito_proveedor_estado();

-- Función para actualizar crédito cuando se elimina un pago
CREATE OR REPLACE FUNCTION update_credito_proveedor_on_pago_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creditos_proveedores
  SET monto_pagado = GREATEST(0, monto_pagado - OLD.monto),
      monto_pendiente = monto_total - GREATEST(0, monto_pagado - OLD.monto),
      updated_at = NOW()
  WHERE id = OLD.credito_proveedor_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar crédito cuando se elimina un pago
CREATE TRIGGER trigger_update_credito_proveedor_on_pago_delete
  AFTER DELETE ON pagos_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_credito_proveedor_on_pago_delete();

-- Función para calcular total de orden de compra
CREATE OR REPLACE FUNCTION calculate_orden_compra_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ordenes_compra
  SET subtotal = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM orden_compra_items
    WHERE orden_compra_id = COALESCE(NEW.orden_compra_id, OLD.orden_compra_id)
  ),
  total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM orden_compra_items
    WHERE orden_compra_id = COALESCE(NEW.orden_compra_id, OLD.orden_compra_id)
  ) - COALESCE(descuento, 0) + COALESCE(impuestos, 0),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.orden_compra_id, OLD.orden_compra_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular total cuando se inserta/actualiza/elimina un item
CREATE TRIGGER trigger_calculate_orden_compra_total
  AFTER INSERT OR UPDATE OR DELETE ON orden_compra_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_orden_compra_total();

-- ============================================
-- 10. HABILITAR RLS
-- ============================================
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. POLÍTICAS RLS
-- ============================================

-- Proveedores
CREATE POLICY "Users can view proveedores from their organization"
  ON proveedores FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert proveedores in their organization"
  ON proveedores FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update proveedores from their organization"
  ON proveedores FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete proveedores from their organization"
  ON proveedores FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Categorías de gastos
CREATE POLICY "Users can view categorias_gastos from their organization"
  ON categorias_gastos FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage categorias_gastos in their organization"
  ON categorias_gastos FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Gastos fijos
CREATE POLICY "Users can view gastos_fijos from their organization"
  ON gastos_fijos FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage gastos_fijos in their organization"
  ON gastos_fijos FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Gastos variables
CREATE POLICY "Users can view gastos_variables from their organization"
  ON gastos_variables FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage gastos_variables in their organization"
  ON gastos_variables FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Órdenes de compra
CREATE POLICY "Users can view ordenes_compra from their organization"
  ON ordenes_compra FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage ordenes_compra in their organization"
  ON ordenes_compra FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Items de orden de compra
CREATE POLICY "Users can view orden_compra_items from their organization"
  ON orden_compra_items FOR SELECT
  USING (
    orden_compra_id IN (
      SELECT id FROM ordenes_compra
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage orden_compra_items in their organization"
  ON orden_compra_items FOR ALL
  USING (
    orden_compra_id IN (
      SELECT id FROM ordenes_compra
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Créditos proveedores
CREATE POLICY "Users can view creditos_proveedores from their organization"
  ON creditos_proveedores FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage creditos_proveedores in their organization"
  ON creditos_proveedores FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Pagos proveedores
CREATE POLICY "Users can view pagos_proveedores from their organization"
  ON pagos_proveedores FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage pagos_proveedores in their organization"
  ON pagos_proveedores FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );
