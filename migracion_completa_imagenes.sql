-- ============================================
-- MIGRACIÓN COMPLETA DE IMÁGENES
-- ============================================
-- Actualiza rutas en base de datos de user_id/ a organization_id/
-- Debe ejecutarse ANTES del script Node.js que copia archivos
-- ============================================

-- PASO 1: Ver estado actual - Productos con imágenes
SELECT 
  '📊 PRODUCTOS CON IMÁGENES (ANTES)' as info,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN imagen IS NOT NULL AND imagen != '' THEN 1 END) as con_imagen,
  COUNT(CASE WHEN imagen IS NULL OR imagen = '' THEN 1 END) as sin_imagen
FROM productos;

-- PASO 2: Ver ejemplos de rutas actuales
SELECT 
  '🔍 EJEMPLOS DE RUTAS ACTUALES' as info,
  id,
  nombre,
  user_id,
  organization_id,
  imagen as ruta_actual,
  split_part(imagen, '/', 2) as carpeta_actual,
  organization_id::text as carpeta_destino
FROM productos
WHERE imagen IS NOT NULL 
  AND imagen != ''
LIMIT 5;

-- PASO 3: Crear tabla temporal para backup
CREATE TEMP TABLE backup_rutas_imagenes AS
SELECT 
  id,
  nombre,
  user_id,
  organization_id,
  imagen as imagen_old,
  CURRENT_TIMESTAMP as backup_date
FROM productos
WHERE imagen IS NOT NULL AND imagen != '';

SELECT 
  '💾 BACKUP CREADO' as info,
  COUNT(*) as productos_respaldados
FROM backup_rutas_imagenes;

-- PASO 4: Actualizar rutas de imágenes
-- Reemplaza {user_id}/{filename} por {organization_id}/{filename}
UPDATE productos
SET imagen = CASE
  WHEN imagen IS NOT NULL AND imagen != '' AND position('/' IN imagen) > 0 THEN
    -- Extrae solo el nombre del archivo (después del primer /)
    organization_id::text || '/' || substring(imagen from position('/' in imagen) + 1)
  ELSE
    imagen -- Mantener NULL o vacío
END
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND organization_id IS NOT NULL;

-- PASO 5: Verificar actualización
SELECT 
  '✅ RUTAS ACTUALIZADAS' as info,
  COUNT(*) as total_actualizados
FROM productos
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND organization_id IS NOT NULL;

-- PASO 6: Ver ejemplos de rutas nuevas
SELECT 
  '🎯 EJEMPLOS DE RUTAS NUEVAS' as info,
  p.id,
  p.nombre,
  b.imagen_old as ruta_antes,
  p.imagen as ruta_ahora,
  split_part(p.imagen, '/', 1)::uuid = p.organization_id as ruta_correcta
FROM productos p
INNER JOIN backup_rutas_imagenes b ON b.id = p.id
LIMIT 5;

-- PASO 7: Identificar productos con rutas inconsistentes
SELECT 
  '⚠️ PRODUCTOS CON RUTAS INCONSISTENTES' as info,
  COUNT(*) as total_inconsistentes
FROM productos
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND organization_id IS NOT NULL
  AND split_part(imagen, '/', 1)::uuid != organization_id;

-- PASO 8: Ver detalle de inconsistencias (si hay)
SELECT 
  '🔍 DETALLE DE INCONSISTENCIAS' as info,
  id,
  nombre,
  organization_id as org_id_esperado,
  split_part(imagen, '/', 1) as org_id_en_ruta,
  imagen
FROM productos
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND organization_id IS NOT NULL
  AND split_part(imagen, '/', 1)::uuid != organization_id
LIMIT 10;

-- PASO 9: Corregir inconsistencias (si las hay)
UPDATE productos
SET imagen = organization_id::text || '/' || substring(imagen from position('/' in imagen) + 1)
WHERE imagen IS NOT NULL 
  AND imagen != ''
  AND organization_id IS NOT NULL
  AND position('/' IN imagen) > 0
  AND split_part(imagen, '/', 1)::uuid != organization_id;

-- PASO 10: Resumen final
SELECT 
  '📊 RESUMEN DE MIGRACIÓN' as info,
  (SELECT COUNT(*) FROM backup_rutas_imagenes) as total_productos_migrados,
  (SELECT COUNT(*) FROM productos WHERE imagen IS NOT NULL AND imagen != '' 
   AND split_part(imagen, '/', 1)::uuid = organization_id) as rutas_correctas,
  (SELECT COUNT(*) FROM productos WHERE imagen IS NOT NULL AND imagen != '' 
   AND split_part(imagen, '/', 1)::uuid != organization_id) as rutas_incorrectas;

-- PASO 11: Datos para el script Node.js
-- Esta query muestra qué archivos copiar
SELECT 
  '📋 ARCHIVOS A COPIAR EN STORAGE' as info,
  user_id::text as carpeta_origen,
  organization_id::text as carpeta_destino,
  substring(b.imagen_old from position('/' in b.imagen_old) + 1) as nombre_archivo,
  b.imagen_old as ruta_origen_completa,
  p.imagen as ruta_destino_completa,
  COUNT(*) OVER() as total_archivos
FROM backup_rutas_imagenes b
INNER JOIN productos p ON p.id = b.id
WHERE b.imagen_old != p.imagen
ORDER BY user_id, nombre_archivo;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
DECLARE
  total_migrados INTEGER;
  total_correctas INTEGER;
  total_incorrectas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_migrados FROM backup_rutas_imagenes;
  
  SELECT COUNT(*) INTO total_correctas 
  FROM productos 
  WHERE imagen IS NOT NULL AND imagen != '' 
    AND organization_id IS NOT NULL
    AND split_part(imagen, '/', 1)::uuid = organization_id;
  
  SELECT COUNT(*) INTO total_incorrectas
  FROM productos 
  WHERE imagen IS NOT NULL AND imagen != '' 
    AND organization_id IS NOT NULL
    AND split_part(imagen, '/', 1)::uuid != organization_id;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRACIÓN DE RUTAS COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Productos migrados: %', total_migrados;
  RAISE NOTICE 'Rutas correctas: %', total_correctas;
  RAISE NOTICE 'Rutas incorrectas: %', total_incorrectas;
  RAISE NOTICE '';
  RAISE NOTICE '📋 SIGUIENTE PASO:';
  RAISE NOTICE '1. Ejecutar: node migrate-storage-images.js';
  RAISE NOTICE '2. El script copiará los archivos físicos';
  RAISE NOTICE '3. Verificar imágenes en la aplicación';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE:';
  RAISE NOTICE '- Las rutas en la BD ya están actualizadas';
  RAISE NOTICE '- Falta copiar archivos en Storage';
  RAISE NOTICE '- Usa el Service Role Key para el script';
  RAISE NOTICE '';
  RAISE NOTICE '✅ BASE DE DATOS LISTA PARA MIGRACIÓN';
  RAISE NOTICE '============================================';
END $$;
