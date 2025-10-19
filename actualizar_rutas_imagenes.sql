-- ============================================
-- ACTUALIZAR RUTAS DE IMÁGENES EXISTENTES
-- ============================================
-- Problema: Las rutas apuntan a organization_id pero los archivos
--           están físicamente en Storage con user_id
-- Solución TEMPORAL: Marcar como NULL para que usuario re-suba
-- ============================================

-- PASO 1: Ver productos con imágenes problemáticas
SELECT 
  '🔍 PRODUCTOS CON IMÁGENES' as info,
  p.id,
  p.nombre,
  p.imagen as ruta_actual,
  p.organization_id,
  o.owner_id,
  '❌ Archivo no existe en esta ruta' as estado
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL 
  AND p.imagen != ''
  AND p.imagen NOT LIKE 'http%' -- No es URL completa
ORDER BY p.created_at DESC
LIMIT 10;

-- PASO 2: OPCIÓN A - Limpiar rutas (usuario re-sube imágenes)
-- Esto pondrá las imágenes en NULL para que el usuario pueda re-subirlas
-- DESCOMENTAR para ejecutar:
/*
UPDATE productos 
SET imagen = NULL
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND imagen NOT LIKE 'http%';
*/

-- PASO 3: Ver resultado
SELECT 
  '📊 RESUMEN' as info,
  COUNT(*) FILTER (WHERE imagen IS NULL) as sin_imagen,
  COUNT(*) FILTER (WHERE imagen IS NOT NULL) as con_imagen,
  COUNT(*) as total
FROM productos;

-- ============================================
-- INSTRUCCIONES
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔧 SOLUCIÓN PARA IMÁGENES ANTIGUAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '❌ PROBLEMA:';
  RAISE NOTICE '  Las rutas en DB apuntan a organization_id';
  RAISE NOTICE '  Pero los archivos están en user_id en Storage';
  RAISE NOTICE '';
  RAISE NOTICE '✅ OPCIÓN 1: Ignorar (RECOMENDADO)';
  RAISE NOTICE '  - Las imágenes antiguas no cargarán';
  RAISE NOTICE '  - Nuevas imágenes funcionarán perfectamente';
  RAISE NOTICE '  - Usuario puede re-subir si quiere';
  RAISE NOTICE '';
  RAISE NOTICE '✅ OPCIÓN 2: Limpiar y re-subir';
  RAISE NOTICE '  1. Descomentar UPDATE arriba';
  RAISE NOTICE '  2. Ejecutar script';
  RAISE NOTICE '  3. Editar productos y subir imágenes nuevamente';
  RAISE NOTICE '';
  RAISE NOTICE '✅ OPCIÓN 3: Migrar archivos físicos';
  RAISE NOTICE '  - Requiere acceso a Supabase Storage API';
  RAISE NOTICE '  - Usar migrate-storage-images.js';
  RAISE NOTICE '  - Más complejo pero mantiene imágenes';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRUEBA ESTO:';
  RAISE NOTICE '  1. Crear NUEVO producto con imagen';
  RAISE NOTICE '  2. Verificar que la imagen carga';
  RAISE NOTICE '  3. Si funciona = políticas OK ✅';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
