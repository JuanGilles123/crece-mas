-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN PARA RECIBOS
-- =====================================================

-- 1. Crear tabla datos_empresa
-- =====================================================
CREATE TABLE IF NOT EXISTS datos_empresa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_empresa TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT NOT NULL,
    nit TEXT NOT NULL,
    logo_url TEXT,
    email TEXT,
    ciudad TEXT,
    departamento TEXT,
    codigo_postal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Habilitar RLS en datos_empresa
-- =====================================================
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para datos_empresa
-- =====================================================
-- Política para que los usuarios solo vean sus propios datos
CREATE POLICY "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo inserten sus propios datos
CREATE POLICY "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo actualicen sus propios datos
CREATE POLICY "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo eliminen sus propios datos
CREATE POLICY "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Agregar columna pago_cliente a ventas si no existe
-- =====================================================
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

-- 5. Crear bucket de storage para recibos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recibos',
    'recibos',
    false,
    10485760, -- 10MB
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 6. Crear bucket de storage para logos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 7. Políticas RLS para bucket recibos
-- =====================================================
-- Política para que los usuarios solo suban recibos a su carpeta
CREATE POLICY "Users can upload receipts to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que los usuarios solo vean sus propios recibos
CREATE POLICY "Users can view own receipts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que los usuarios solo eliminen sus propios recibos
CREATE POLICY "Users can delete own receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 8. Políticas RLS para bucket logos
-- =====================================================
-- Política para que los usuarios solo suban logos a su carpeta
CREATE POLICY "Users can upload logos to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que los usuarios solo vean sus propios logos
CREATE POLICY "Users can view own logos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que los usuarios solo eliminen sus propios logos
CREATE POLICY "Users can delete own logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para que todos puedan ver logos (públicos)
CREATE POLICY "Logos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- 9. Función para actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Trigger para actualizar updated_at en datos_empresa
-- =====================================================
DROP TRIGGER IF EXISTS update_datos_empresa_updated_at ON datos_empresa;
CREATE TRIGGER update_datos_empresa_updated_at
    BEFORE UPDATE ON datos_empresa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONFIGURACIÓN COMPLETADA
-- =====================================================
