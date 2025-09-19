-- SOLUCIÓN FORZADA - EJECUTAR EN SUPABASE SQL EDITOR
-- Este script fuerza la configuración correcta

-- 1. DESHABILITAR RLS TEMPORALMENTE PARA CONFIGURAR
ALTER TABLE datos_empresa DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can insert own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can update own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can delete own company data" ON datos_empresa;

-- 3. HABILITAR RLS NUEVAMENTE
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS RLS CORRECTAS
CREATE POLICY "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);

-- 5. ELIMINAR BUCKETS EXISTENTES SI HAY PROBLEMAS
DELETE FROM storage.buckets WHERE id IN ('logos', 'recibos');

-- 6. CREAR BUCKET DE LOGOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
);

-- 7. CREAR BUCKET DE RECIBOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recibos',
    'recibos',
    false,
    10485760,
    ARRAY['application/pdf']
);

-- 8. ELIMINAR POLÍTICAS DE STORAGE EXISTENTES
DROP POLICY IF EXISTS "Users can upload logos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload receipts to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

-- 9. CREAR POLÍTICAS PARA LOGOS
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

CREATE POLICY "Logos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- 10. CREAR POLÍTICAS PARA RECIBOS
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

-- 11. AGREGAR COLUMNA pago_cliente A VENTAS
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
