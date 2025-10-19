-- ============================================
-- DIAGNÓSTICO DEL SISTEMA DE ROLES
-- ============================================
-- Ejecuta este script para ver el estado actual
-- del sistema de roles y detectar problemas
-- ============================================

-- 1. VERIFICAR QUE LAS TABLAS EXISTEN
SELECT 
  'user_profiles' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM user_profiles
UNION ALL
SELECT 
  'organizations' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM organizations
UNION ALL
SELECT 
  'team_members' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM team_members
UNION ALL
SELECT 
  'team_invitations' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as estado
FROM team_invitations;

-- 2. VERIFICAR USUARIOS REGISTRADOS
SELECT 
  '📊 USUARIOS REGISTRADOS' as seccion,
  '' as info;

SELECT 
  au.email,
  au.created_at as fecha_registro,
  CASE 
    WHEN up.user_id IS NOT NULL THEN '✅ Migrado'
    ELSE '❌ Sin migrar'
  END as estado_migracion,
  COALESCE(up.role, 'Sin rol') as rol,
  COALESCE(o.name, 'Sin organización') as organizacion
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
ORDER BY au.created_at DESC
LIMIT 20;

-- 3. VERIFICAR TU USUARIO ESPECÍFICO
SELECT 
  '🔍 TU USUARIO ACTUAL' as seccion,
  '' as info;

-- REEMPLAZA 'tu-email@ejemplo.com' con tu email real
SELECT 
  au.email,
  au.id as user_id,
  up.role,
  up.organization_id,
  o.name as organization_name,
  tm.id as team_member_id,
  tm.status as team_status,
  CASE 
    WHEN up.user_id IS NULL THEN '❌ No existe en user_profiles - EJECUTAR MIGRACIÓN'
    WHEN up.organization_id IS NULL THEN '⚠️ Sin organización asignada - EJECUTAR MIGRACIÓN'
    WHEN tm.id IS NULL THEN '⚠️ No está en team_members - EJECUTAR MIGRACIÓN'
    ELSE '✅ Todo correcto'
  END as diagnostico
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
LEFT JOIN team_members tm ON tm.user_id = au.id AND tm.organization_id = o.id
WHERE au.email = 'tu-email@ejemplo.com'; -- ⚠️ CAMBIA ESTO POR TU EMAIL

-- 4. VERIFICAR FUNCIONES Y TRIGGERS
SELECT 
  '🔧 TRIGGERS Y FUNCIONES' as seccion,
  '' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅'
    ELSE '⚠️'
  END as estado
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%user%';

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
  '🔒 POLÍTICAS RLS' as seccion,
  '' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅'
    ELSE '❌'
  END as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'organizations', 'team_members', 'team_invitations')
ORDER BY tablename, policyname;

-- 6. VERIFICAR ORGANIZACIONES
SELECT 
  '🏢 ORGANIZACIONES' as seccion,
  '' as info;

SELECT 
  o.name,
  au.email as owner_email,
  o.business_type,
  o.max_team_members as limite,
  (SELECT COUNT(*) FROM team_members WHERE organization_id = o.id AND status = 'active') as miembros_activos,
  o.subscription_plan as plan,
  o.is_active as activa
FROM organizations o
JOIN auth.users au ON o.owner_id = au.id
ORDER BY o.created_at DESC;

-- 7. VERIFICAR MIEMBROS DE EQUIPO
SELECT 
  '👥 MIEMBROS DE EQUIPOS' as seccion,
  '' as info;

SELECT 
  o.name as organizacion,
  au.email as miembro_email,
  tm.role as rol,
  tm.status as estado,
  tm.joined_at as fecha_union,
  inviter.email as invitado_por
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
JOIN auth.users au ON tm.user_id = au.id
LEFT JOIN auth.users inviter ON tm.invited_by = inviter.id
ORDER BY o.name, tm.joined_at DESC;

-- 8. RESUMEN FINAL
SELECT 
  '📋 RESUMEN' as seccion,
  '' as info;

SELECT 
  'Total Usuarios' as metrica,
  COUNT(*)::text as valor
FROM auth.users
UNION ALL
SELECT 
  'Usuarios Migrados' as metrica,
  COUNT(*)::text as valor
FROM user_profiles
UNION ALL
SELECT 
  'Organizaciones' as metrica,
  COUNT(*)::text as valor
FROM organizations
UNION ALL
SELECT 
  'Miembros de Equipo' as metrica,
  COUNT(*)::text as valor
FROM team_members WHERE status = 'active'
UNION ALL
SELECT 
  'Invitaciones Pendientes' as metrica,
  COUNT(*)::text as valor
FROM team_invitations WHERE status = 'pending';

-- ============================================
-- INSTRUCCIONES
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📖 CÓMO INTERPRETAR LOS RESULTADOS:';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Si ves "❌ Sin migrar" en tu usuario:';
  RAISE NOTICE '   → Ejecuta: migracion_usuarios_existentes.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ Si no aparece tu email en "TU USUARIO ACTUAL":';
  RAISE NOTICE '   → Cambia "tu-email@ejemplo.com" por tu email real';
  RAISE NOTICE '   → Vuelve a ejecutar este script';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ Si todo está ✅ pero no ves el menú "Equipo":';
  RAISE NOTICE '   → Cierra sesión completamente';
  RAISE NOTICE '   → Limpia caché del navegador (Ctrl+Shift+Delete)';
  RAISE NOTICE '   → Vuelve a iniciar sesión';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Si el trigger no existe:';
  RAISE NOTICE '   → Ejecuta nuevamente: setup_roles_equipos.sql';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
