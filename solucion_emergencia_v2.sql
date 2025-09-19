-- SOLUCIÓN DE EMERGENCIA - SOLO DATOS_EMPRESA
-- Ejecutar en Supabase SQL Editor

-- 1. DESHABILITAR RLS EN datos_empresa TEMPORALMENTE
ALTER TABLE datos_empresa DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR QUE RLS ESTÁ DESHABILITADO
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'datos_empresa';
