-- Crear tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    topping_id UUID REFERENCES toppings(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'venta', 'ajuste', 'salida')),
    cantidad DECIMAL NOT NULL,
    stock_anterior DECIMAL,
    stock_nuevo DECIMAL NOT NULL,
    referencia_id UUID, -- Puede ser un ID de venta, compra, etc.
    usuario_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notas TEXT
);

-- Habilitar RLS
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Asegúrate de que coincidan con tu estructura de permisos)
CREATE POLICY "Users can view their organization movements"
    ON movimientos_stock FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their organization movements"
    ON movimientos_stock FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_org ON movimientos_stock(organization_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_created_at ON movimientos_stock(created_at);
