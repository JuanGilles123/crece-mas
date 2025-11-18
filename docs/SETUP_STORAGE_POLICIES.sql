-- 🔐 Políticas de Storage para el bucket 'productos'
-- Permite subir y leer imágenes de productos y toppings
-- Ejecutar en Supabase SQL Editor
--
-- ⚠️ IMPORTANTE: Antes de ejecutar esto, ejecuta:
--    docs/VER_POLITICAS_STORAGE.sql para ver las políticas actuales
--
-- Verificar que el bucket existe:
-- Si no existe, créalo desde Supabase Dashboard > Storage > New bucket
-- Nombre: productos
-- Public: false (privado, requiere autenticación)

-- ⚠️ ADVERTENCIA: Estas políticas pueden sobrescribir políticas existentes
-- Si ya tienes políticas personalizadas, revísalas primero con VER_POLITICAS_STORAGE.sql

-- Eliminar políticas existentes si existen (para poder recrearlas)
-- Solo elimina las políticas que vamos a crear, no todas las políticas
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;

-- Policy: Usuarios pueden SUBIR imágenes de productos (en su carpeta de organización)
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos' AND
  (
    -- Pueden subir en su carpeta de organización (productos/{organization_id}/)
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Pueden subir en carpeta de toppings de su organización (productos/toppings/{organization_id}/)
    (storage.foldername(name))[1] = 'toppings' AND
    (storage.foldername(name))[2] IN (
      SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- Policy: Usuarios pueden LEER imágenes de productos (de su organización)
CREATE POLICY "Users can read product images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'productos' AND
  (
    -- Pueden leer de su carpeta de organización
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Pueden leer de carpeta de toppings de su organización
    (storage.foldername(name))[1] = 'toppings' AND
    (storage.foldername(name))[2] IN (
      SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- Policy: Usuarios pueden ACTUALIZAR imágenes de productos (solo owners/admins)
CREATE POLICY "Users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'productos' AND
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (
        -- Pueden actualizar en su carpeta de organización
        (storage.foldername(name))[1] = organization_id::text
        OR
        -- Pueden actualizar en carpeta de toppings de su organización
        ((storage.foldername(name))[1] = 'toppings' AND (storage.foldername(name))[2] = organization_id::text)
      )
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND (
        (storage.foldername(name))[1] = organization_id::text
        OR
        ((storage.foldername(name))[1] = 'toppings' AND (storage.foldername(name))[2] = organization_id::text)
      )
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  )
);

-- Policy: Usuarios pueden ELIMINAR imágenes de productos (solo owners/admins)
CREATE POLICY "Users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productos' AND
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (
        -- Pueden eliminar en su carpeta de organización
        (storage.foldername(name))[1] = organization_id::text
        OR
        -- Pueden eliminar en carpeta de toppings de su organización
        ((storage.foldername(name))[1] = 'toppings' AND (storage.foldername(name))[2] = organization_id::text)
      )
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND (
        (storage.foldername(name))[1] = organization_id::text
        OR
        ((storage.foldername(name))[1] = 'toppings' AND (storage.foldername(name))[2] = organization_id::text)
      )
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  )
);

-- Comentarios
COMMENT ON POLICY "Users can upload product images" ON storage.objects IS 
  'Permite a usuarios subir imágenes de productos y toppings en su carpeta de organización';

COMMENT ON POLICY "Users can read product images" ON storage.objects IS 
  'Permite a usuarios leer imágenes de productos y toppings de su organización';

COMMENT ON POLICY "Users can update product images" ON storage.objects IS 
  'Permite a owners/admins actualizar imágenes de productos y toppings';

COMMENT ON POLICY "Users can delete product images" ON storage.objects IS 
  'Permite a owners/admins eliminar imágenes de productos y toppings';

