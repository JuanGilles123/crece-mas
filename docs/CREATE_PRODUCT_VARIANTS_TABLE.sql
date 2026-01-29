-- Tabla de variantes por producto (color/tono) con stock y código de barras opcional
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo TEXT NULL,
  stock NUMERIC NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Código de barras único por organización (cuando existe)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_codigo_unique
ON product_variants (organization_id, codigo)
WHERE codigo IS NOT NULL AND codigo <> '';

CREATE INDEX IF NOT EXISTS idx_product_variants_producto ON product_variants (producto_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_org ON product_variants (organization_id);

-- Trigger para mantener stock del producto = sumatoria de variantes
CREATE OR REPLACE FUNCTION update_producto_stock_from_variants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock = (
    SELECT COALESCE(SUM(stock), 0)
    FROM product_variants
    WHERE producto_id = COALESCE(NEW.producto_id, OLD.producto_id)
  )
  WHERE id = COALESCE(NEW.producto_id, OLD.producto_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_producto_stock_from_variants ON product_variants;

CREATE TRIGGER trg_update_producto_stock_from_variants
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_producto_stock_from_variants();

-- RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver variantes de su organización"
  ON product_variants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Usuarios pueden insertar variantes en su organización"
  ON product_variants FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Usuarios pueden actualizar variantes de su organización"
  ON product_variants FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Usuarios pueden eliminar variantes de su organización"
  ON product_variants FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
