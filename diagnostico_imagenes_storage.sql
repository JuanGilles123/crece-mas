-- ============================================
-- DIAGNÓSTICO Y SOLUCIÓN: ERRORES 400 EN IMÁGENES
-- ============================================
-- Los productos tienen rutas como: productos/organization_id/filename
-- Pero los archivos pueden estar en: productos/user_id/filename
-- ============================================

-- PASO 1: Ver productos con imágenes
SELECT 
  '🖼️ PRODUCTOS CON IMÁGENES' as info,
  p.id,
  p.nombre,
  p.imagen,
  p.organization_id,
  o.name as nombre_organizacion,
  o.owner_id,
  LENGTH(p.imagen) as longitud_ruta
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL 
  AND p.imagen != ''
ORDER BY p.created_at DESC
LIMIT 10;

-- PASO 2: Verificar estructura de las rutas
-- Si la ruta incluye organization_id → OK
-- Si la ruta incluye user_id → PROBLEMA (debe migrar)
SELECT 
  '🔍 ANÁLISIS DE RUTAS' as info,
  CASE 
    WHEN imagen LIKE '%' || organization_id::text || '%' THEN '✅ Ruta correcta (organization_id)'
    WHEN imagen LIKE '%' || owner_id::text || '%' THEN '⚠️ Ruta antigua (owner_id)'
    ELSE '❓ Ruta desconocida'
  END as estado_ruta,
  COUNT(*) as cantidad,
  STRING_AGG(DISTINCT nombre, ', ') as ejemplos
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE imagen IS NOT NULL AND imagen != ''
GROUP BY estado_ruta;

-- PASO 3: Ver rutas específicas que causan error 400
SELECT 
  '❌ PRODUCTOS CON RUTAS PROBLEMÁTICAS' as info,
  p.id,
  p.nombre,
  p.imagen as ruta_actual,
  'productos/' || o.id::text || '/' || 
    SUBSTRING(p.imagen FROM '[^/]+$') as ruta_correcta_deberia_ser,
  o.owner_id as user_id_del_owner
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL 
  AND p.imagen != ''
  AND p.imagen NOT LIKE '%' || o.id::text || '%'
ORDER BY p.created_at DESC;

-- PASO 4: Script de CORRECCIÓN
-- Este UPDATE cambia las rutas de los productos para usar organization_id

-- IMPORTANTE: Antes de ejecutar, VERIFICA que los archivos existan en Storage
-- Opción A: Los archivos YA están en productos/organization_id/ → Solo actualiza DB
-- Opción B: Los archivos están en productos/user_id/ → Necesitas migrar archivos primero

-- Descomentar para EJECUTAR (después de verificar):
/*
UPDATE productos p
SET imagen = 'productos/' || p.organization_id::text || '/' || 
              SUBSTRING(p.imagen FROM '[^/]+$')
FROM organizations o
WHERE p.organization_id = o.id
  AND p.imagen IS NOT NULL 
  AND p.imagen != ''
  AND p.imagen NOT LIKE '%' || p.organization_id::text || '%';
*/

-- PASO 5: Verificar políticas RLS en Storage
-- Las políticas del bucket 'productos' deben permitir acceso por organization_id

SELECT 
  '📋 VERIFICAR POLÍTICAS STORAGE' as info,
  'Ir a Supabase Dashboard → Storage → Bucket productos → Policies' as instrucciones;

-- PASO 6: Verificar datos después de la corrección
SELECT 
  '✅ VERIFICACIÓN POST-CORRECCIÓN' as info,
  p.nombre,
  p.imagen,
  CASE 
    WHEN p.imagen LIKE '%' || p.organization_id::text || '%' THEN '✅ Correcto'
    ELSE '❌ Incorrecto'
  END as estado
FROM productos p
WHERE p.imagen IS NOT NULL AND p.imagen != ''
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- SOLUCIONES RECOMENDADAS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🛠️ SOLUCIONES PARA ERROR 400 EN IMÁGENES';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DIAGNÓSTICO:';
  RAISE NOTICE '  - Los productos tienen rutas con organization_id';
  RAISE NOTICE '  - Pero los archivos pueden estar en user_id/';
  RAISE NOTICE '  - Storage retorna 400 porque no encuentra los archivos';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SOLUCIÓN 1 (RÁPIDA): Actualizar solo nuevas imágenes';
  RAISE NOTICE '  1. Dejar las imágenes antiguas como están';
  RAISE NOTICE '  2. Nuevas imágenes se subirán correctamente';
  RAISE NOTICE '  3. Re-subir imágenes antiguas manualmente';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SOLUCIÓN 2 (COMPLETA): Migrar archivos en Storage';
  RAISE NOTICE '  1. Ejecutar migrate-storage-images.js';
  RAISE NOTICE '  2. Copia archivos de user_id/ a organization_id/';
  RAISE NOTICE '  3. Actualizar rutas en base de datos';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SOLUCIÓN 3 (INMEDIATA): Ignorar errores de imagen';
  RAISE NOTICE '  1. Los productos funcionan sin imagen';
  RAISE NOTICE '  2. Mostrar placeholder cuando falle';
  RAISE NOTICE '  3. Usuario puede re-subir cuando quiera';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RECOMENDACIÓN:';
  RAISE NOTICE '  Usar SOLUCIÓN 3 por ahora (ignorar errores)';
  RAISE NOTICE '  Las nuevas imágenes funcionarán correctamente';
  RAISE NOTICE '  Migrar archivos antiguos cuando sea necesario';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
