-- ============================================
-- REPARACIÓN: Crear organización faltante
-- ============================================
-- Usa este script si ves "No tienes una organización"
-- ============================================

-- PASO 1: Ver el estado actual de tu usuario
-- CAMBIA 'tu-email@ejemplo.com' por tu email real
SELECT 
  '🔍 ESTADO ACTUAL' as seccion,
  au.email,
  au.id as user_id,
  up.role,
  up.organization_id,
  CASE 
    WHEN up.organization_id IS NULL THEN '❌ Sin organización'
    ELSE '✅ Tiene organización'
  END as estado
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'tu-email@ejemplo.com'; -- ⚠️ CAMBIA ESTO

-- PASO 2: Crear organización para tu usuario
-- CAMBIA 'tu-email@ejemplo.com' por tu email real
INSERT INTO organizations (owner_id, name, business_type, max_team_members, subscription_plan)
SELECT 
  au.id as owner_id,
  COALESCE(
    au.raw_user_meta_data->>'organization_name',
    'Negocio de ' || COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
  ) as name,
  COALESCE(au.raw_user_meta_data->>'business_type', 'retail') as business_type,
  10 as max_team_members, -- Límite inicial
  'free' as subscription_plan
FROM auth.users au
WHERE au.email = 'tu-email@ejemplo.com' -- ⚠️ CAMBIA ESTO
  AND NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = au.id
  );

-- PASO 3: Actualizar user_profiles con la organización
UPDATE user_profiles up
SET organization_id = o.id,
    role = 'owner' -- Asegurar que sea owner
FROM organizations o
JOIN auth.users au ON o.owner_id = au.id
WHERE up.user_id = au.id
  AND au.email = 'tu-email@ejemplo.com' -- ⚠️ CAMBIA ESTO
  AND up.organization_id IS NULL;

-- PASO 4: Crear membresía en team_members
INSERT INTO team_members (organization_id, user_id, role, invited_by, permissions, status)
SELECT 
  o.id as organization_id,
  au.id as user_id,
  'owner' as role,
  au.id as invited_by,
  '{"all": true}'::jsonb as permissions,
  'active' as status
FROM auth.users au
JOIN organizations o ON o.owner_id = au.id
WHERE au.email = 'tu-email@ejemplo.com' -- ⚠️ CAMBIA ESTO
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = au.id 
      AND tm.organization_id = o.id
  );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 
  '✅ VERIFICACIÓN FINAL' as seccion,
  au.email,
  up.role as rol_usuario,
  o.name as nombre_organizacion,
  o.business_type as tipo_negocio,
  o.max_team_members as limite_miembros,
  tm.role as rol_en_equipo,
  tm.status as estado_miembro,
  CASE 
    WHEN o.id IS NOT NULL AND tm.id IS NOT NULL THEN '✅ TODO CORRECTO - LISTO PARA USAR'
    WHEN o.id IS NULL THEN '❌ FALTA CREAR ORGANIZACIÓN'
    WHEN tm.id IS NULL THEN '❌ FALTA AGREGAR A TEAM_MEMBERS'
    ELSE '⚠️ REVISAR CONFIGURACIÓN'
  END as diagnostico
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
LEFT JOIN team_members tm ON tm.user_id = au.id AND tm.organization_id = o.id
WHERE au.email = 'tu-email@ejemplo.com'; -- ⚠️ CAMBIA ESTO

-- Ver todos los datos de la organización
SELECT 
  '📊 DATOS DE TU ORGANIZACIÓN' as seccion,
  o.id,
  o.name as nombre,
  o.business_type as tipo_negocio,
  o.max_team_members as limite,
  o.subscription_plan as plan,
  o.is_active as activa,
  o.created_at as fecha_creacion,
  au.email as owner_email
FROM organizations o
JOIN auth.users au ON o.owner_id = au.id
WHERE au.email = 'tu-email@ejemplo.com'; -- ⚠️ CAMBIA ESTO

-- ============================================
-- INSTRUCCIONES FINALES
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ REPARACIÓN COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SIGUIENTE PASO:';
  RAISE NOTICE '1. Revisa que el "diagnostico" diga: ✅ TODO CORRECTO';
  RAISE NOTICE '2. Si todo está correcto, haz lo siguiente:';
  RAISE NOTICE '';
  RAISE NOTICE '   a) CIERRA SESIÓN en la aplicación';
  RAISE NOTICE '   b) LIMPIA CACHÉ del navegador (Ctrl+Shift+Delete)';
  RAISE NOTICE '   c) CIERRA el navegador completamente';
  RAISE NOTICE '   d) ABRE el navegador y vuelve a iniciar sesión';
  RAISE NOTICE '';
  RAISE NOTICE '3. Después de iniciar sesión:';
  RAISE NOTICE '   - Ve a Dashboard → Equipo';
  RAISE NOTICE '   - Deberías ver tu información y el botón "Invitar Miembro"';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
