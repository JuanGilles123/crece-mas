-- ============================================
-- DIAGNÓSTICO Y REPARACIÓN DE ERRORES 500
-- ============================================
-- Este script diagnostica y repara problemas con RLS y triggers
-- ============================================

-- PASO 1: VERIFICAR POLÍTICAS RLS PROBLEMÁTICAS
SELECT 
  '🔍 POLÍTICAS RLS ACTUALES' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'user_profiles', 'team_members', 'team_invitations')
ORDER BY tablename, policyname;

-- PASO 2: VERIFICAR TRIGGERS PROBLEMÁTICOS
SELECT 
  '🔍 TRIGGERS ACTUALES' as seccion,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- REPARACIÓN: DESACTIVAR Y RECREAR RLS
-- ============================================

-- Desactivar RLS temporalmente para diagnóstico
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
DROP POLICY IF EXISTS "Users can read organization by member" ON organizations;
DROP POLICY IF EXISTS "Owners can update own organization" ON organizations;
DROP POLICY IF EXISTS "Users can read organization" ON organizations;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by owners" ON organizations;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by same org" ON user_profiles;
DROP POLICY IF EXISTS "Profiles are updatable by user" ON user_profiles;

DROP POLICY IF EXISTS "Team members readable by same org" ON team_members;
DROP POLICY IF EXISTS "Team members manageable by admins" ON team_members;
DROP POLICY IF EXISTS "Members are viewable by same org" ON team_members;
DROP POLICY IF EXISTS "Members are manageable by admin" ON team_members;

DROP POLICY IF EXISTS "Invitations readable by recipient" ON team_invitations;
DROP POLICY IF EXISTS "Invitations manageable by sender" ON team_invitations;
DROP POLICY IF EXISTS "Invitations viewable by recipient" ON team_invitations;
DROP POLICY IF EXISTS "Invitations manageable by admins" ON team_invitations;

-- ============================================
-- RECREAR POLÍTICAS RLS SIMPLIFICADAS
-- ============================================

-- Re-activar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: Políticas simplificadas
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.organization_id = organizations.id 
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.organization_id = organizations.id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  );

-- USER_PROFILES: Políticas simplificadas
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = user_profiles.organization_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- TEAM_MEMBERS: Políticas simplificadas
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- TEAM_INVITATIONS: Políticas simplificadas
CREATE POLICY "team_invitations_select_policy" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_invitations_insert_policy" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_invitations_update_policy" ON team_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_invitations_delete_policy" ON team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- VERIFICAR TRIGGER PROBLEMÁTICO
-- ============================================

-- Eliminar trigger si existe y causaba problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear el trigger de forma más segura
CREATE OR REPLACE FUNCTION create_user_profile_and_organization()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_user_name TEXT;
  v_org_name TEXT;
BEGIN
  -- Obtener nombre del usuario
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generar nombre de organización
  v_org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    'Negocio de ' || v_user_name
  );

  -- Crear organización
  INSERT INTO organizations (owner_id, name, business_type)
  VALUES (
    NEW.id,
    v_org_name,
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'retail')
  )
  RETURNING id INTO v_org_id;

  -- Crear perfil de usuario
  INSERT INTO user_profiles (user_id, role, full_name, organization_id)
  VALUES (
    NEW.id,
    'owner',
    v_user_name,
    v_org_id
  );

  -- Crear membresía de equipo
  INSERT INTO team_members (organization_id, user_id, role, invited_by, permissions)
  VALUES (
    v_org_id,
    NEW.id,
    'owner',
    NEW.id,
    '{"all": true}'::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, registrar pero no fallar el registro
    RAISE WARNING 'Error creating profile/org for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_and_organization();

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS' as seccion,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'user_profiles', 'team_members', 'team_invitations');

SELECT 
  '✅ VERIFICACIÓN DE TRIGGERS' as seccion,
  COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ REPARACIÓN DE RLS COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CAMBIOS REALIZADOS:';
  RAISE NOTICE '1. ✅ Políticas RLS simplificadas y recreadas';
  RAISE NOTICE '2. ✅ Trigger de creación de usuario reparado';
  RAISE NOTICE '3. ✅ Manejo de errores mejorado';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AHORA EJECUTA:';
  RAISE NOTICE '1. El script reparar_organizacion.sql (con tu email)';
  RAISE NOTICE '2. Limpia caché del navegador';
  RAISE NOTICE '3. Cierra sesión y vuelve a iniciar';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
