-- SOLUCIÓN INMEDIATA PARA ERRORES 406 Y 400
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR Y CONFIGURAR RLS EN datos_empresa
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can insert own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can update own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can delete own company data" ON datos_empresa;

-- Crear políticas RLS correctas
CREATE POLICY "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);

-- 2. CREAR BUCKET DE LOGOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. CREAR BUCKET DE RECIBOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recibos',
    'recibos',
    false,
    10485760, -- 10MB
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 4. CONFIGURAR POLÍTICAS PARA BUCKET LOGOS
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can upload logos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;

-- Crear políticas para logos
CREATE POLICY "Users can upload logos to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own logos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que todos puedan ver logos (públicos)
CREATE POLICY "Logos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- 5. CONFIGURAR POLÍTICAS PARA BUCKET RECIBOS
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can upload receipts to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

-- Crear políticas para recibos
CREATE POLICY "Users can upload receipts to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own receipts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. AGREGAR COLUMNA pago_cliente A VENTAS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ventas' AND column_name = 'pago_cliente'
    ) THEN
        ALTER TABLE ventas ADD COLUMN pago_cliente NUMERIC;
    END IF;
END $$;
