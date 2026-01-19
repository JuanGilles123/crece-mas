-- SCRIPT DE DIAGNÓSTICO
-- Ejecutar en Supabase SQL Editor para ver qué está mal

-- 1. Verificar si la tabla datos_empresa existe
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_name = 'datos_empresa';

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'datos_empresa';

-- 3. Verificar políticas existentes en datos_empresa
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'datos_empresa';

-- 4. Verificar buckets de storage existentes
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('logos', 'recibos');

-- 5. Verificar políticas de storage
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%logos%' OR policyname LIKE '%recibos%';

-- 6. Verificar columna pago_cliente en ventas
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ventas' 
AND column_name = 'pago_cliente';
