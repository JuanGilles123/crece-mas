-- 🍔 Agregar políticas de storage para toppings (Versión con permisos)
-- Este SQL agrega soporte para la carpeta toppings/ sin modificar las políticas existentes
-- Ejecutar en Supabase SQL Editor
--
-- ⚠️ IMPORTANTE: Si obtienes error "must be owner", asegúrate de:
--    1. Estar autenticado como owner del proyecto en Supabase Dashboard
--    2. O usar el SQL Editor desde el Dashboard (no desde una conexión externa)
--    3. O contactar al administrador del proyecto para ejecutar este SQL

-- Policy: Usuarios pueden SUBIR imágenes de toppings (en toppings/{organization_id}/)
-- Esta política complementa la existente "Usuarios autorizados pueden subir imagenes"
DROP POLICY IF EXISTS "Users can upload topping images" ON storage.objects;
CREATE POLICY "Users can upload topping images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'productos' AND
  (storage.foldername(name))[1] = 'toppings' AND
  (storage.foldername(name))[2] IN (
    SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
    UNION
    SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Policy: Usuarios pueden LEER imágenes de toppings (de toppings/{organization_id}/)
-- Esta política complementa la existente "Team members pueden ver imagenes de organizacion"
DROP POLICY IF EXISTS "Users can read topping images" ON storage.objects;
CREATE POLICY "Users can read topping images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'productos' AND
  (storage.foldername(name))[1] = 'toppings' AND
  (storage.foldername(name))[2] IN (
    SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
    UNION
    SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Policy: Owners/Admins pueden ACTUALIZAR imágenes de toppings
-- Esta política complementa la existente "Usuarios autorizados pueden actualizar imagenes"
DROP POLICY IF EXISTS "Owners and admins can update topping images" ON storage.objects;
CREATE POLICY "Owners and admins can update topping images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'productos' AND
  (storage.foldername(name))[1] = 'toppings' AND
  (storage.foldername(name))[2] IN (
    SELECT organization_id::text FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    UNION
    SELECT organization_id::text FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
  )
);

-- Policy: Owners/Admins pueden ELIMINAR imágenes de toppings
-- Esta política complementa la existente "Owners y Admins pueden eliminar imagenes"
DROP POLICY IF EXISTS "Owners and admins can delete topping images" ON storage.objects;
CREATE POLICY "Owners and admins can delete topping images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'productos' AND
  (storage.foldername(name))[1] = 'toppings' AND
  (storage.foldername(name))[2] IN (
    SELECT organization_id::text FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    UNION
    SELECT organization_id::text FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
  )
);

-- Comentarios
COMMENT ON POLICY "Users can upload topping images" ON storage.objects IS 
  'Permite a usuarios subir imágenes de toppings en toppings/{organization_id}/';

COMMENT ON POLICY "Users can read topping images" ON storage.objects IS 
  'Permite a usuarios leer imágenes de toppings de su organización';

COMMENT ON POLICY "Owners and admins can update topping images" ON storage.objects IS 
  'Permite a owners/admins actualizar imágenes de toppings';

COMMENT ON POLICY "Owners and admins can delete topping images" ON storage.objects IS 
  'Permite a owners/admins eliminar imágenes de toppings';

