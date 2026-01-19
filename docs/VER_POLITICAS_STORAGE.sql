-- 🔍 Consultar políticas actuales del bucket 'productos'
-- Ejecutar en Supabase SQL Editor para ver qué políticas existen

-- Ver todas las políticas del bucket 'productos'
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
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Ver información detallada de cada política
SELECT 
  p.policyname AS "Nombre de Política",
  p.cmd AS "Comando (SELECT/INSERT/UPDATE/DELETE)",
  p.permissive AS "Permisiva",
  p.roles AS "Roles",
  CASE 
    WHEN p.qual IS NOT NULL THEN p.qual::text
    ELSE 'Sin condición USING'
  END AS "Condición USING",
  CASE 
    WHEN p.with_check IS NOT NULL THEN p.with_check::text
    ELSE 'Sin condición WITH CHECK'
  END AS "Condición WITH CHECK"
FROM pg_policies p
WHERE p.tablename = 'objects'
  AND p.schemaname = 'storage'
ORDER BY p.policyname;

-- Ver si hay políticas específicas para el bucket 'productos'
-- (Las políticas de storage generalmente verifican bucket_id en la condición)
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    qual::text LIKE '%productos%' 
    OR with_check::text LIKE '%productos%'
    OR policyname LIKE '%product%'
  )
ORDER BY policyname;

-- Ver todas las políticas de storage (sin filtro)
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 200)
    ELSE 'Sin condición USING'
  END AS "Condición (primeros 200 caracteres)"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY cmd, policyname;

