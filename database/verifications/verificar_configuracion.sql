-- Script para verificar y completar la configuración
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que RLS está habilitado en datos_empresa
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas RLS si no existen
CREATE POLICY IF NOT EXISTS "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Agregar columna pago_cliente a ventas si no existe
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

-- 4. Crear bucket de storage para recibos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recibos',
    'recibos',
    false,
    10485760, -- 10MB
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 5. Crear bucket de storage para logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 6. Políticas RLS para bucket recibos
CREATE POLICY IF NOT EXISTS "Users can upload receipts to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can view own receipts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can delete own receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 7. Políticas RLS para bucket logos
CREATE POLICY IF NOT EXISTS "Users can upload logos to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can view own logos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can delete own logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que todos puedan ver logos (públicos)
CREATE POLICY IF NOT EXISTS "Logos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');
