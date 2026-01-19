-- Diagnóstico completo de la funcionalidad de ventas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la tabla ventas existe y tiene la estructura correcta
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ventas' 
ORDER BY ordinal_position;

-- 2. Verificar que la tabla productos existe y tiene stock
SELECT 
    id,
    nombre,
    stock,
    precio_venta,
    user_id
FROM productos 
LIMIT 5;

-- 3. Verificar políticas RLS en ventas
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
WHERE tablename = 'ventas';

-- 4. Verificar políticas RLS en productos
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

-- 5. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('ventas', 'productos');

-- 6. Verificar datos de empresa
SELECT 
    id,
    user_id,
    nombre_empresa,
    direccion,
    telefono,
    nit
FROM datos_empresa 
LIMIT 3;

-- 7. Verificar políticas RLS en datos_empresa
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
WHERE tablename = 'datos_empresa';

-- 8. Verificar buckets de storage
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 9. Verificar políticas de storage
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 10. Verificar ventas recientes (si las hay)
SELECT 
    id,
    user_id,
    total,
    metodo_pago,
    fecha,
    created_at
FROM ventas 
ORDER BY created_at DESC 
LIMIT 5;
