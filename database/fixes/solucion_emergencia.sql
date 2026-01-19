-- SOLUCIÓN DE EMERGENCIA - DESHABILITAR RLS TEMPORALMENTE
-- Ejecutar en Supabase SQL Editor

-- 1. DESHABILITAR RLS EN datos_empresa TEMPORALMENTE
ALTER TABLE datos_empresa DISABLE ROW LEVEL SECURITY;

-- 2. DESHABILITAR RLS EN storage.objects TEMPORALMENTE
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR QUE RLS ESTÁ DESHABILITADO
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('datos_empresa', 'objects');
