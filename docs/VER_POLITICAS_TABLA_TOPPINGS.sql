-- 🔍 Consultar políticas actuales de la tabla 'toppings'
-- Ejecutar en Supabase SQL Editor para ver qué políticas existen

-- Ver todas las políticas de la tabla 'toppings'
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
WHERE tablename = 'toppings'
ORDER BY policyname;

-- Ver información detallada de cada política
SELECT 
  p.policyname AS "Nombre de Política",
  p.cmd AS "Comando (SELECT/INSERT/UPDATE/DELETE)",
  p.permissive AS "Permisiva",
  p.roles AS "Roles",
  CASE 
    WHEN p.qual IS NOT NULL THEN substring(p.qual::text, 1, 300)
    ELSE 'Sin condición USING'
  END AS "Condición USING (primeros 300 caracteres)",
  CASE 
    WHEN p.with_check IS NOT NULL THEN substring(p.with_check::text, 1, 300)
    ELSE 'Sin condición WITH CHECK'
  END AS "Condición WITH CHECK (primeros 300 caracteres)"
FROM pg_policies p
WHERE p.tablename = 'toppings'
ORDER BY p.policyname;

-- Verificar si RLS está habilitado en la tabla
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE tablename = 'toppings';

