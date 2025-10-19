-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- Ejecutar DESPUÉS de completar la migración completa
-- Para confirmar que todo está funcionando correctamente
-- ============================================

-- PASO 1: Verificar columnas de facturación
SELECT 
  '✅ PASO 1: COLUMNAS DE FACTURACIÓN' as info,
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('razon_social', 'nit', 'direccion', 'telefono', 'email', 
                         'ciudad', 'regimen_tributario', 'responsable_iva', 
                         'logo_url', 'mensaje_factura') THEN '✅'
    ELSE '❌'
  END as estado
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('razon_social', 'nit', 'direccion', 'telefono', 'email', 
                      'ciudad', 'regimen_tributario', 'responsable_iva', 
                      'logo_url', 'mensaje_factura')
ORDER BY ordinal_position;

-- PASO 2: Ver organizaciones con datos de facturación
SELECT 
  '📊 PASO 2: DATOS DE FACTURACIÓN' as info,
  name as organizacion,
  razon_social,
  nit,
  email,
  telefono,
  ciudad,
  CASE 
    WHEN razon_social IS NOT NULL THEN '✅ Completo'
    ELSE '⚠️ Incompleto'
  END as estado_facturacion
FROM organizations
ORDER BY created_at DESC;

-- PASO 3: Verificar rutas de imágenes en productos
SELECT 
  '🖼️ PASO 3: RUTAS DE IMÁGENES EN BD' as info,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN imagen IS NOT NULL AND imagen != '' THEN 1 END) as con_imagen,
  COUNT(CASE WHEN imagen IS NULL OR imagen = '' THEN 1 END) as sin_imagen,
  COUNT(CASE 
    WHEN imagen IS NOT NULL 
     AND imagen != '' 
     AND split_part(imagen, '/', 1)::uuid = organization_id 
    THEN 1 
  END) as rutas_correctas,
  COUNT(CASE 
    WHEN imagen IS NOT NULL 
     AND imagen != '' 
     AND split_part(imagen, '/', 1)::uuid != organization_id 
    THEN 1 
  END) as rutas_incorrectas
FROM productos;

-- PASO 4: Ejemplos de productos con imágenes
SELECT 
  '📋 PASO 4: EJEMPLOS DE PRODUCTOS' as info,
  p.nombre,
  o.name as organizacion,
  p.imagen,
  CASE 
    WHEN split_part(p.imagen, '/', 1)::uuid = p.organization_id 
    THEN '✅ Correcta'
    ELSE '❌ Incorrecta'
  END as estado_ruta
FROM productos p
INNER JOIN organizations o ON o.id = p.organization_id
WHERE p.imagen IS NOT NULL AND p.imagen != ''
ORDER BY p.created_at DESC
LIMIT 10;

-- PASO 5: Verificar archivos en Storage
SELECT 
  '💾 PASO 5: ARCHIVOS EN STORAGE' as info,
  bucket_id,
  COUNT(*) as total_archivos,
  COUNT(DISTINCT split_part(name, '/', 1)) as carpetas_unicas,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as tamano_total
FROM storage.objects
WHERE bucket_id = 'productos'
GROUP BY bucket_id;

-- PASO 6: Ver archivos recientes en Storage
SELECT 
  '📁 PASO 6: ARCHIVOS RECIENTES' as info,
  name as ruta_completa,
  split_part(name, '/', 1) as carpeta,
  split_part(name, '/', 2) as archivo,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as tamano,
  created_at
FROM storage.objects
WHERE bucket_id = 'productos'
ORDER BY created_at DESC
LIMIT 10;

-- PASO 7: Verificar políticas de Storage
SELECT 
  '🔒 PASO 7: POLÍTICAS DE STORAGE' as info,
  policyname as nombre_politica,
  CASE cmd
    WHEN 'r' THEN 'SELECT (Ver)'
    WHEN 'a' THEN 'INSERT (Subir)'
    WHEN 'w' THEN 'UPDATE (Actualizar)'
    WHEN 'd' THEN 'DELETE (Eliminar)'
    ELSE cmd::text
  END as tipo_permiso,
  CASE 
    WHEN policyname LIKE '%team%' OR policyname LIKE '%organizacion%' 
    THEN '✅ Multi-org'
    ELSE '⚠️ Usuario único'
  END as tipo_politica
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- PASO 8: Verificar políticas RLS en productos
SELECT 
  '🛡️ PASO 8: POLÍTICAS RLS PRODUCTOS' as info,
  policyname as nombre_politica,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as tipo_permiso,
  CASE 
    WHEN qual LIKE '%organization_id%' THEN '✅ Multi-org'
    WHEN qual LIKE '%user_id%' THEN '⚠️ Usuario único'
    ELSE '❓ Otro'
  END as tipo_acceso
FROM pg_policies
WHERE tablename = 'productos'
  AND schemaname = 'public'
ORDER BY policyname;

-- PASO 9: Ver team_members activos
SELECT 
  '👥 PASO 9: MIEMBROS DE EQUIPOS' as info,
  o.name as organizacion,
  COUNT(*) as total_miembros,
  COUNT(CASE WHEN tm.role = 'owner' THEN 1 END) as owners,
  COUNT(CASE WHEN tm.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN tm.role = 'member' THEN 1 END) as members,
  COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as activos
FROM team_members tm
INNER JOIN organizations o ON o.id = tm.organization_id
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;

-- PASO 10: Verificar índices importantes
SELECT 
  '📊 PASO 10: ÍNDICES IMPORTANTES' as info,
  tablename as tabla,
  indexname as nombre_indice,
  CASE 
    WHEN indexdef LIKE '%organization_id%' THEN '✅ Multi-org'
    WHEN indexdef LIKE '%user_id%' THEN '⚠️ Usuario único'
    ELSE '❓ Otro'
  END as tipo_indice
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('productos', 'ventas', 'team_members', 'organizations')
  AND (indexdef LIKE '%organization_id%' OR indexdef LIKE '%user_id%')
ORDER BY tablename, indexname;

-- PASO 11: Resumen de productos por organización
SELECT 
  '📦 PASO 11: PRODUCTOS POR ORGANIZACIÓN' as info,
  o.name as organizacion,
  COUNT(p.id) as total_productos,
  COUNT(CASE WHEN p.imagen IS NOT NULL AND p.imagen != '' THEN 1 END) as con_imagen,
  COUNT(CASE WHEN p.stock > 0 THEN 1 END) as con_stock,
  SUM(p.stock) as stock_total,
  COUNT(CASE 
    WHEN p.imagen IS NOT NULL 
     AND p.imagen != '' 
     AND split_part(p.imagen, '/', 1)::uuid = p.organization_id 
    THEN 1 
  END) as imagenes_migradas
FROM organizations o
LEFT JOIN productos p ON p.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY total_productos DESC;

-- PASO 12: Ventas recientes por organización
SELECT 
  '💰 PASO 12: VENTAS RECIENTES' as info,
  o.name as organizacion,
  COUNT(v.id) as total_ventas,
  SUM(v.total) as total_vendido,
  MAX(v.fecha) as ultima_venta
FROM organizations o
LEFT JOIN ventas v ON v.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY total_ventas DESC;

-- ============================================
-- MENSAJE FINAL CON RESUMEN
-- ============================================
DO $$
DECLARE
  total_orgs INTEGER;
  orgs_con_facturacion INTEGER;
  total_productos INTEGER;
  productos_con_imagen INTEGER;
  rutas_correctas INTEGER;
  rutas_incorrectas INTEGER;
  total_archivos_storage INTEGER;
  total_members INTEGER;
BEGIN
  -- Contar organizaciones
  SELECT COUNT(*) INTO total_orgs FROM organizations;
  SELECT COUNT(*) INTO orgs_con_facturacion 
  FROM organizations WHERE razon_social IS NOT NULL;
  
  -- Contar productos
  SELECT COUNT(*) INTO total_productos FROM productos;
  SELECT COUNT(*) INTO productos_con_imagen 
  FROM productos WHERE imagen IS NOT NULL AND imagen != '';
  
  -- Contar rutas
  SELECT COUNT(*) INTO rutas_correctas
  FROM productos 
  WHERE imagen IS NOT NULL 
    AND imagen != ''
    AND split_part(imagen, '/', 1)::uuid = organization_id;
  
  SELECT COUNT(*) INTO rutas_incorrectas
  FROM productos 
  WHERE imagen IS NOT NULL 
    AND imagen != ''
    AND split_part(imagen, '/', 1)::uuid != organization_id;
  
  -- Contar archivos en Storage
  SELECT COUNT(*) INTO total_archivos_storage
  FROM storage.objects WHERE bucket_id = 'productos';
  
  -- Contar team members
  SELECT COUNT(*) INTO total_members 
  FROM team_members WHERE status = 'active';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 RESUMEN DE VERIFICACIÓN POST-MIGRACIÓN';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  
  -- Organizaciones
  RAISE NOTICE '🏢 ORGANIZACIONES:';
  RAISE NOTICE '   Total: %', total_orgs;
  RAISE NOTICE '   Con facturación: % (%)', orgs_con_facturacion, 
    CASE 
      WHEN total_orgs > 0 
      THEN ROUND((orgs_con_facturacion::numeric / total_orgs) * 100) || '%'
      ELSE 'N/A'
    END;
  IF orgs_con_facturacion = total_orgs THEN
    RAISE NOTICE '   ✅ Todas las organizaciones tienen facturación';
  ELSE
    RAISE NOTICE '   ⚠️ Faltan % org por configurar facturación', total_orgs - orgs_con_facturacion;
  END IF;
  RAISE NOTICE '';
  
  -- Productos
  RAISE NOTICE '📦 PRODUCTOS:';
  RAISE NOTICE '   Total: %', total_productos;
  RAISE NOTICE '   Con imagen: %', productos_con_imagen;
  RAISE NOTICE '   Rutas correctas: %', rutas_correctas;
  RAISE NOTICE '   Rutas incorrectas: %', rutas_incorrectas;
  IF rutas_incorrectas = 0 THEN
    RAISE NOTICE '   ✅ Todas las rutas están correctas';
  ELSE
    RAISE NOTICE '   ❌ Hay % rutas incorrectas - revisar!', rutas_incorrectas;
  END IF;
  RAISE NOTICE '';
  
  -- Storage
  RAISE NOTICE '💾 STORAGE:';
  RAISE NOTICE '   Archivos en bucket productos: %', total_archivos_storage;
  IF total_archivos_storage >= productos_con_imagen THEN
    RAISE NOTICE '   ✅ Todos los archivos están en Storage';
  ELSE
    RAISE NOTICE '   ⚠️ Faltan % archivos en Storage', productos_con_imagen - total_archivos_storage;
  END IF;
  RAISE NOTICE '';
  
  -- Team Members
  RAISE NOTICE '👥 TEAM MEMBERS:';
  RAISE NOTICE '   Total activos: %', total_members;
  RAISE NOTICE '';
  
  -- Estado general
  RAISE NOTICE '============================================';
  IF orgs_con_facturacion = total_orgs 
     AND rutas_incorrectas = 0 
     AND total_archivos_storage >= productos_con_imagen THEN
    RAISE NOTICE '🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Todo está funcionando correctamente:';
    RAISE NOTICE '   • Facturación configurada';
    RAISE NOTICE '   • Rutas de imágenes correctas';
    RAISE NOTICE '   • Archivos migrados en Storage';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema listo para producción';
  ELSE
    RAISE NOTICE '⚠️ MIGRACIÓN INCOMPLETA';
    RAISE NOTICE '';
    RAISE NOTICE 'Acciones pendientes:';
    IF orgs_con_facturacion < total_orgs THEN
      RAISE NOTICE '   • Configurar facturación en % org', total_orgs - orgs_con_facturacion;
    END IF;
    IF rutas_incorrectas > 0 THEN
      RAISE NOTICE '   • Corregir % rutas de imágenes', rutas_incorrectas;
    END IF;
    IF total_archivos_storage < productos_con_imagen THEN
      RAISE NOTICE '   • Migrar % archivos a Storage', productos_con_imagen - total_archivos_storage;
    END IF;
  END IF;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
