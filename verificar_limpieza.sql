-- VERIFICAR SI LAS POLÍTICAS SE LIMPIARON CORRECTAMENTE
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar políticas en datos_empresa
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'datos_empresa'
ORDER BY policyname;

-- 2. Verificar políticas en storage
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND (policyname LIKE '%logos%' OR policyname LIKE '%recibos%' OR policyname LIKE '%Users%')
ORDER BY policyname;
