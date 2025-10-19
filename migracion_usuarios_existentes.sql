-- ============================================
-- MIGRACIÓN DE USUARIOS EXISTENTES
-- ============================================
-- Este script migra usuarios existentes al sistema de roles
-- Ejecuta esto DESPUÉS de setup_roles_equipos.sql
-- ============================================

-- Paso 1: Migrar usuarios existentes a user_profiles
INSERT INTO user_profiles (user_id, role, full_name, phone, organization_id)
SELECT 
  au.id as user_id,
  'owner' as role,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'phone' as phone,
  NULL as organization_id
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
);

-- Paso 2: Crear organizaciones para usuarios existentes que no tengan una
INSERT INTO organizations (owner_id, name, business_type)
SELECT 
  au.id as owner_id,
  COALESCE(
    au.raw_user_meta_data->>'organization_name',
    'Negocio de ' || COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
  ) as name,
  COALESCE(au.raw_user_meta_data->>'business_type', 'retail') as business_type
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.owner_id = au.id
);

-- Paso 3: Actualizar organization_id en user_profiles
UPDATE user_profiles up
SET organization_id = o.id
FROM organizations o
WHERE o.owner_id = up.user_id
  AND up.organization_id IS NULL;

-- Paso 4: Crear membresías de equipo para usuarios existentes
INSERT INTO team_members (organization_id, user_id, role, invited_by, permissions)
SELECT 
  o.id as organization_id,
  o.owner_id as user_id,
  'owner' as role,
  o.owner_id as invited_by,
  '{"all": true}'::jsonb as permissions
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.organization_id = o.id 
    AND tm.user_id = o.owner_id
);

-- Paso 5: Actualizar productos existentes con organization_id (opcional)
-- Solo si quieres asociar productos existentes a la organización
-- DESCOMENTAR SI DESEAS USAR ESTO:
/*
ALTER TABLE productos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE productos p
SET organization_id = up.organization_id
FROM user_profiles up
WHERE p.user_id = up.user_id
  AND p.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_productos_organization ON productos(organization_id);
*/

-- Paso 6: Actualizar ventas existentes con organization_id (opcional)
-- Solo si quieres asociar ventas existentes a la organización
-- DESCOMENTAR SI DESEAS USAR ESTO:
/*
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE ventas v
SET organization_id = up.organization_id
FROM user_profiles up
WHERE v.user_id = up.user_id
  AND v.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_organization ON ventas(organization_id);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver usuarios migrados
SELECT 
  au.email,
  up.role,
  o.name as organization_name,
  tm.id as team_member_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
LEFT JOIN team_members tm ON tm.user_id = au.id AND tm.organization_id = o.id
ORDER BY au.created_at;

-- Contar usuarios por rol
SELECT 
  role,
  COUNT(*) as total
FROM user_profiles
GROUP BY role
ORDER BY role;

-- Ver organizaciones creadas
SELECT 
  o.name,
  au.email as owner_email,
  o.business_type,
  o.max_team_members,
  (SELECT COUNT(*) FROM team_members WHERE organization_id = o.id) as current_members
FROM organizations o
JOIN auth.users au ON o.owner_id = au.id
ORDER BY o.created_at DESC;

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================
DO $$
DECLARE
  user_count INTEGER;
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  SELECT COUNT(*) INTO org_count FROM organizations;
  
  RAISE NOTICE '✅ Migración completada exitosamente!';
  RAISE NOTICE '📊 Total de usuarios migrados: %', user_count;
  RAISE NOTICE '🏢 Total de organizaciones creadas: %', org_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ahora puedes:';
  RAISE NOTICE '1. Cerrar sesión y volver a iniciar';
  RAISE NOTICE '2. Refrescar el navegador';
  RAISE NOTICE '3. Ir a Dashboard → Equipo';
END $$;
