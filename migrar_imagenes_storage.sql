-- ============================================
-- MIGRAR IMÁGENES DE PRODUCTOS A NUEVA ESTRUCTURA
-- ============================================
-- Este script actualiza las rutas de las imágenes
-- de user_id/ a organization_id/
-- ============================================

-- PASO 1: Ver estado actual de las imágenes
SELECT 
  '📊 IMÁGENES ACTUALES' as info,
  COUNT(*) as total_productos,
  COUNT(imagen) as con_imagen,
  COUNT(*) - COUNT(imagen) as sin_imagen
FROM productos;

-- PASO 2: Ver rutas actuales
SELECT 
  '🖼️ RUTAS DE IMÁGENES' as info,
  p.id,
  p.nombre,
  p.imagen as ruta_actual,
  p.user_id,
  p.organization_id,
  o.name as organizacion
FROM productos p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL
LIMIT 10;

-- PASO 3: Actualizar rutas de imágenes
-- Cambiar: user_id/filename.jpg
-- Por:     organization_id/filename.jpg
UPDATE productos
SET imagen = REPLACE(imagen, user_id::text, organization_id::text)
WHERE imagen IS NOT NULL
  AND imagen LIKE '%' || user_id::text || '%';

-- PASO 4: Verificar actualización
SELECT 
  '✅ RUTAS ACTUALIZADAS' as resultado,
  COUNT(*) as imagenes_actualizadas
FROM productos
WHERE imagen IS NOT NULL
  AND imagen LIKE '%' || organization_id::text || '%';

-- PASO 5: Ver rutas nuevas
SELECT 
  '🎯 NUEVAS RUTAS' as info,
  p.nombre,
  p.imagen as nueva_ruta,
  o.name as organizacion
FROM productos p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL
LIMIT 10;

-- ============================================
-- IMPORTANTE: MIGRAR ARCHIVOS EN STORAGE
-- ============================================
-- ⚠️ Este script solo actualiza las rutas en la BD
-- 
-- Para mover los archivos físicos en Supabase Storage:
-- 1. Ve a Storage → productos
-- 2. Copia manualmente las carpetas de user_id/ a organization_id/
-- O usa el script de JavaScript que crearé a continuación
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ RUTAS ACTUALIZADAS EN BASE DE DATOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ SIGUIENTE PASO IMPORTANTE:';
  RAISE NOTICE 'Las rutas en la BD están actualizadas, pero los';
  RAISE NOTICE 'archivos físicos aún están en las carpetas antiguas.';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 OPCIONES:';
  RAISE NOTICE '1. Ejecutar script JS para mover archivos (recomendado)';
  RAISE NOTICE '2. Mover manualmente en Supabase Storage';
  RAISE NOTICE '3. Re-subir las imágenes desde la app';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
