-- ============================================
-- SOLUCIÓN: IMÁGENES NO CARGAN - POLÍTICAS STORAGE PRODUCTOS
-- ============================================
-- Problema: Team members no pueden ver imágenes de productos de su organización
-- Causa: Políticas RLS del bucket 'productos' son muy restrictivas
-- Solución: Crear políticas basadas en team_members
-- ============================================

-- NOTA: Las políticas de Storage no tienen tabla visible
-- Solo podemos crear/eliminar políticas, no consultarlas directamente

-- PASO 1: Eliminar políticas antiguas restrictivas
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- PASO 2: Crear políticas multi-organización

-- ✅ POLÍTICA 1: Ver imágenes (SELECT)
-- Todos los team_members pueden ver imágenes de su organización
CREATE POLICY "Team members ver imagenes organizacion"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'productos' 
  AND (
    -- Extraer organization_id de la ruta: productos/{org_id}/file.jpg
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text 
      FROM team_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  )
);

-- ✅ POLÍTICA 2: Subir imágenes (INSERT)
-- Owner y Admin pueden subir imágenes
CREATE POLICY "Owners y Admins subir imagenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text 
      FROM team_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  )
);

-- ✅ POLÍTICA 3: Actualizar imágenes (UPDATE)
-- Owner y Admin pueden actualizar imágenes
CREATE POLICY "Owners y Admins actualizar imagenes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'productos'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text 
      FROM team_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  )
);

-- ✅ POLÍTICA 4: Eliminar imágenes (DELETE)
-- Solo Owners pueden eliminar imágenes
CREATE POLICY "Solo owners eliminar imagenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productos'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text 
      FROM team_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'owner'
    )
  )
);

-- PASO 3: Verificar bucket existe
SELECT 
  '✅ BUCKET PRODUCTOS' as info,
  name as bucket_name,
  public as es_publico,
  file_size_limit / 1024 / 1024 as limite_mb,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'productos';

-- PASO 4: Probar acceso - Ver rutas de productos
SELECT 
  '🧪 PRUEBA: Tus productos con imágenes' as info,
  p.nombre,
  p.imagen as ruta_completa,
  (string_to_array(p.imagen, '/'))[2] as organization_id_en_ruta,
  p.organization_id as organization_id_real,
  tm.role as tu_rol,
  CASE 
    WHEN (string_to_array(p.imagen, '/'))[2] = p.organization_id::text 
    THEN '✅ Ruta correcta'
    ELSE '❌ Ruta incorrecta'
  END as estado_ruta
FROM productos p
INNER JOIN team_members tm ON tm.organization_id = p.organization_id
WHERE p.imagen IS NOT NULL 
  AND p.imagen != ''
  AND tm.user_id = auth.uid()
  AND tm.status = 'active'
ORDER BY p.created_at DESC
LIMIT 5;

-- PASO 5: Verificar tu acceso a team_members
SELECT 
  '👥 TUS ORGANIZACIONES' as info,
  o.name as organizacion,
  tm.role as tu_rol,
  tm.status,
  o.id as organization_id
FROM team_members tm
INNER JOIN organizations o ON o.id = tm.organization_id
WHERE tm.user_id = auth.uid()
ORDER BY tm.created_at DESC;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
DECLARE
  bucket_is_public BOOLEAN;
  total_members INTEGER;
BEGIN
  -- Verificar si bucket es público
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE name = 'productos';
  
  -- Contar team members del usuario actual
  SELECT COUNT(*) INTO total_members
  FROM team_members
  WHERE user_id = auth.uid() AND status = 'active';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ POLÍTICAS STORAGE PRODUCTOS CONFIGURADAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket: productos';
  RAISE NOTICE 'Es público: %', bucket_is_public;
  RAISE NOTICE 'Políticas creadas: 4 (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE 'Tus organizaciones: %', total_members;
  RAISE NOTICE '';
  RAISE NOTICE '📋 PERMISOS POR ROL:';
  RAISE NOTICE '  👑 Owner   → Ver ✅ Subir ✅ Actualizar ✅ Eliminar ✅';
  RAISE NOTICE '  👨‍💼 Admin   → Ver ✅ Subir ✅ Actualizar ✅ Eliminar ❌';
  RAISE NOTICE '  👤 Member  → Ver ✅ Subir ❌ Actualizar ❌ Eliminar ❌';
  RAISE NOTICE '';
  RAISE NOTICE '📂 ESTRUCTURA CORRECTA DE PATHS:';
  RAISE NOTICE '  productos/{organization_id}/{filename}.jpg';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SIGUIENTE PASO:';
  RAISE NOTICE '1. Abrir la aplicación';
  RAISE NOTICE '2. Ir a Inventario';
  RAISE NOTICE '3. Las imágenes deberían cargar ahora';
  RAISE NOTICE '4. Probar con usuario invitado';
  RAISE NOTICE '';
  RAISE NOTICE '✅ POLÍTICAS APLICADAS EXITOSAMENTE';
  RAISE NOTICE '============================================';
END $$;
