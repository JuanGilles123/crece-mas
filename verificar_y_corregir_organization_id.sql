-- ============================================
-- VERIFICAR Y CORREGIR organization_id
-- ============================================
-- Ejecuta esto después de agregar_organization_id.sql
-- ============================================

-- PASO 1: Verificar estado actual
SELECT 
  '📊 ESTADO ACTUAL DE PRODUCTOS' as info,
  COUNT(*) as total_productos,
  COUNT(organization_id) as con_organization_id,
  COUNT(*) - COUNT(organization_id) as sin_organization_id
FROM productos;

SELECT 
  '📊 ESTADO ACTUAL DE VENTAS' as info,
  COUNT(*) as total_ventas,
  COUNT(organization_id) as con_organization_id,
  COUNT(*) - COUNT(organization_id) as sin_organization_id
FROM ventas;

-- PASO 2: Ver productos sin organization_id
SELECT 
  '⚠️ PRODUCTOS SIN ORGANIZATION_ID' as problema,
  p.id,
  p.nombre,
  p.user_id,
  up.organization_id as org_en_perfil
FROM productos p
LEFT JOIN user_profiles up ON up.user_id = p.user_id
WHERE p.organization_id IS NULL
LIMIT 10;

-- PASO 3: Corregir productos sin organization_id
-- Opción A: Usar organization_id del perfil del usuario
UPDATE productos p
SET organization_id = (
  SELECT up.organization_id 
  FROM user_profiles up 
  WHERE up.user_id = p.user_id
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND user_id IS NOT NULL;

-- Opción B: Si el usuario no tiene perfil, usar su primera organización de team_members
UPDATE productos p
SET organization_id = (
  SELECT tm.organization_id 
  FROM team_members tm 
  WHERE tm.user_id = p.user_id 
    AND tm.status = 'active'
  ORDER BY tm.created_at ASC
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND user_id IS NOT NULL;

-- PASO 4: Corregir ventas sin organization_id
UPDATE ventas v
SET organization_id = (
  SELECT up.organization_id 
  FROM user_profiles up 
  WHERE up.user_id = v.user_id
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND user_id IS NOT NULL;

-- Opción B para ventas
UPDATE ventas v
SET organization_id = (
  SELECT tm.organization_id 
  FROM team_members tm 
  WHERE tm.user_id = v.user_id 
    AND tm.status = 'active'
  ORDER BY tm.created_at ASC
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND user_id IS NOT NULL;

-- PASO 5: Verificar corrección
SELECT 
  '✅ DESPUÉS DE CORRECCIÓN' as resultado,
  (SELECT COUNT(*) FROM productos WHERE organization_id IS NULL) as productos_sin_org,
  (SELECT COUNT(*) FROM ventas WHERE organization_id IS NULL) as ventas_sin_org;

-- PASO 6: Ver distribución por organización
SELECT 
  '📊 PRODUCTOS POR ORGANIZACIÓN' as info,
  o.name as organizacion,
  COUNT(p.id) as total_productos
FROM organizations o
LEFT JOIN productos p ON p.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY total_productos DESC;

SELECT 
  '📊 VENTAS POR ORGANIZACIÓN' as info,
  o.name as organizacion,
  COUNT(v.id) as total_ventas
FROM organizations o
LEFT JOIN ventas v ON v.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY total_ventas DESC;

-- PASO 7: Verificar que el usuario actual tiene acceso
SELECT 
  '👤 TUS ORGANIZACIONES Y DATOS' as info,
  o.name as organizacion,
  tm.role as tu_rol,
  (SELECT COUNT(*) FROM productos WHERE organization_id = o.id) as productos,
  (SELECT COUNT(*) FROM ventas WHERE organization_id = o.id) as ventas
FROM organizations o
INNER JOIN team_members tm ON tm.organization_id = o.id
WHERE tm.user_id = auth.uid()
  AND tm.status = 'active'
ORDER BY tm.created_at;

-- PASO 8: Mostrar productos del usuario actual
SELECT 
  '📦 TUS PRODUCTOS VISIBLES' as info,
  p.id,
  p.nombre,
  p.precio_venta,
  o.name as organizacion
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE p.organization_id IN (
  SELECT organization_id FROM team_members 
  WHERE user_id = auth.uid() AND status = 'active'
)
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- DIAGNÓSTICO FINAL
-- ============================================
DO $$
DECLARE
  productos_sin_org INTEGER;
  ventas_sin_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO productos_sin_org FROM productos WHERE organization_id IS NULL;
  SELECT COUNT(*) INTO ventas_sin_org FROM ventas WHERE organization_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 DIAGNÓSTICO FINAL';
  RAISE NOTICE '============================================';
  
  IF productos_sin_org = 0 AND ventas_sin_org = 0 THEN
    RAISE NOTICE '✅ PERFECTO: Todos los datos tienen organization_id';
    RAISE NOTICE '✅ Total productos: %', (SELECT COUNT(*) FROM productos);
    RAISE NOTICE '✅ Total ventas: %', (SELECT COUNT(*) FROM ventas);
  ELSE
    RAISE NOTICE '⚠️ HAY DATOS SIN organization_id:';
    RAISE NOTICE '   - Productos sin org: %', productos_sin_org;
    RAISE NOTICE '   - Ventas sin org: %', ventas_sin_org;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 SOLUCIÓN: Verifica user_profiles y team_members';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SIGUIENTE PASO:';
  RAISE NOTICE '1. Recarga tu aplicación (F5)';
  RAISE NOTICE '2. Los datos deberían aparecer ahora';
  RAISE NOTICE '3. Si no aparecen, revisa las consultas arriba';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
