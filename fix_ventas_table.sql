-- Script para verificar y corregir la tabla de ventas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla ventas existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ventas'
);

-- 2. Si no existe, crear la tabla ventas
CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL,
    items JSONB NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    pago_cliente DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS en la tabla ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para ventas
-- Política para que los usuarios solo vean sus propias ventas
DROP POLICY IF EXISTS "Users can view own sales" ON ventas;
CREATE POLICY "Users can view own sales" ON ventas
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo inserten sus propias ventas
DROP POLICY IF EXISTS "Users can insert own sales" ON ventas;
CREATE POLICY "Users can insert own sales" ON ventas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo actualicen sus propias ventas
DROP POLICY IF EXISTS "Users can update own sales" ON ventas;
CREATE POLICY "Users can update own sales" ON ventas
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo eliminen sus propias ventas
DROP POLICY IF EXISTS "Users can delete own sales" ON ventas;
CREATE POLICY "Users can delete own sales" ON ventas
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Verificar que la tabla productos tiene la columna stock
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' AND column_name = 'stock';

-- 6. Si no existe la columna stock, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'stock'
    ) THEN
        ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0;
    END IF;
END $$;

-- 7. Verificar que la tabla productos tiene la columna precio_venta
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' AND column_name = 'precio_venta';

-- 8. Si no existe la columna precio_venta, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'precio_venta'
    ) THEN
        ALTER TABLE productos ADD COLUMN precio_venta DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- 9. Verificar políticas RLS en productos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'productos';

-- 10. Crear políticas RLS para productos si no existen
-- Política para que los usuarios solo vean sus propios productos
DROP POLICY IF EXISTS "Users can view own products" ON productos;
CREATE POLICY "Users can view own products" ON productos
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo inserten sus propios productos
DROP POLICY IF EXISTS "Users can insert own products" ON productos;
CREATE POLICY "Users can insert own products" ON productos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo actualicen sus propios productos
DROP POLICY IF EXISTS "Users can update own products" ON productos;
CREATE POLICY "Users can update own products" ON productos
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo eliminen sus propios productos
DROP POLICY IF EXISTS "Users can delete own products" ON productos;
CREATE POLICY "Users can delete own products" ON productos
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Verificar que RLS está habilitado en productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 12. Verificar la estructura final de la tabla ventas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ventas' 
ORDER BY ordinal_position;

-- 13. Verificar la estructura final de la tabla productos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
