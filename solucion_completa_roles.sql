-- ============================================
-- SOLUCIÓN COMPLETA - SISTEMA DE ROLES
-- ============================================
-- Este script limpia y recrea TODO el sistema correctamente
-- ============================================

-- PASO 1: LIMPIAR TODO
-- ============================================

-- Desactivar RLS temporalmente
ALTER TABLE IF EXISTS team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Eliminar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile_and_organization();

-- Eliminar TODAS las políticas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('organizations', 'user_profiles', 'team_members', 'team_invitations')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- PASO 2: CREAR POLÍTICAS RLS CORRECTAS
-- ============================================

-- Re-activar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS
-- ============================================
-- SELECT: Ver organizaciones donde eres owner o miembro
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.organization_id = organizations.id 
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- INSERT: Solo puedes crear organizaciones si eres el owner
CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Solo owner o admins pueden actualizar
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE 
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.organization_id = organizations.id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
        AND team_members.status = 'active'
    )
  );

-- DELETE: Solo el owner puede eliminar
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- USER_PROFILES
-- ============================================
-- SELECT: Ver tu propio perfil o perfiles de tu organización
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT 
  USING (
    auth.uid() = user_id OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  );

-- INSERT: Solo puedes crear tu propio perfil
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo puedes actualizar tu propio perfil
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- DELETE: Solo puedes eliminar tu propio perfil
CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE 
  USING (auth.uid() = user_id);

-- TEAM_MEMBERS
-- ============================================
-- SELECT: Ver miembros de tu organización
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- INSERT: Admins y owners pueden agregar miembros, O auto-agregarse
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT 
  WITH CHECK (
    -- Permitir auto-inserción cuando eres el owner de la org
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_id 
        AND owner_id = auth.uid()
    ))
    OR
    -- O si eres admin/owner de la organización
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.status = 'active'
    )
  );

-- UPDATE: Solo admins/owners pueden cambiar roles
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.status = 'active'
    )
  );

-- DELETE: Solo admins/owners pueden remover miembros
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.status = 'active'
    )
  );

-- TEAM_INVITATIONS
-- ============================================
-- SELECT: Ver invitaciones que te enviaron o que enviaste
CREATE POLICY "team_invitations_select" ON team_invitations
  FOR SELECT 
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- INSERT: Solo admins/owners pueden invitar
CREATE POLICY "team_invitations_insert" ON team_invitations
  FOR INSERT 
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE organization_id = team_invitations.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- UPDATE: El invitado puede aceptar/rechazar, el invitador puede cancelar
CREATE POLICY "team_invitations_update" ON team_invitations
  FOR UPDATE 
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- DELETE: Solo quien invitó puede eliminar
CREATE POLICY "team_invitations_delete" ON team_invitations
  FOR DELETE 
  USING (
    invited_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- PASO 3: CREAR TRIGGER PARA NUEVOS USUARIOS
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile_and_organization()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_name TEXT;
  v_org_name TEXT;
BEGIN
  -- Obtener nombre del usuario
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generar nombre de organización
  v_org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    'Negocio de ' || v_user_name
  );

  -- Crear organización primero
  INSERT INTO organizations (owner_id, name, business_type, max_team_members, subscription_plan, is_active)
  VALUES (
    NEW.id,
    v_org_name,
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'retail'),
    10,
    'free',
    true
  )
  RETURNING id INTO v_org_id;

  -- Crear perfil de usuario
  INSERT INTO user_profiles (user_id, role, full_name, organization_id, phone, avatar_url)
  VALUES (
    NEW.id,
    'owner',
    v_user_name,
    v_org_id,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Crear membresía de equipo
  INSERT INTO team_members (organization_id, user_id, role, invited_by, permissions, status)
  VALUES (
    v_org_id,
    NEW.id,
    'owner',
    NEW.id,
    '{"all": true}'::jsonb,
    'active'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el registro del usuario
    RAISE WARNING 'Error creating profile/org for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_and_organization();

-- PASO 4: MIGRAR USUARIOS EXISTENTES
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_org_id UUID;
  v_user_name TEXT;
  v_org_name TEXT;
BEGIN
  -- Procesar cada usuario que no tenga perfil
  FOR v_user IN (
    SELECT au.* 
    FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
    )
  ) LOOP
    BEGIN
      -- Obtener nombre del usuario
      v_user_name := COALESCE(
        v_user.raw_user_meta_data->>'full_name',
        v_user.raw_user_meta_data->>'name',
        split_part(v_user.email, '@', 1)
      );
      
      -- Generar nombre de organización
      v_org_name := COALESCE(
        v_user.raw_user_meta_data->>'organization_name',
        'Negocio de ' || v_user_name
      );

      -- Crear organización
      INSERT INTO organizations (owner_id, name, business_type, max_team_members, subscription_plan, is_active)
      VALUES (
        v_user.id,
        v_org_name,
        COALESCE(v_user.raw_user_meta_data->>'business_type', 'retail'),
        10,
        'free',
        true
      )
      RETURNING id INTO v_org_id;

      -- Crear perfil
      INSERT INTO user_profiles (user_id, role, full_name, organization_id, phone, avatar_url)
      VALUES (
        v_user.id,
        'owner',
        v_user_name,
        v_org_id,
        v_user.raw_user_meta_data->>'phone',
        v_user.raw_user_meta_data->>'avatar_url'
      );

      -- Crear membresía
      INSERT INTO team_members (organization_id, user_id, role, invited_by, permissions, status)
      VALUES (
        v_org_id,
        v_user.id,
        'owner',
        v_user.id,
        '{"all": true}'::jsonb,
        'active'
      );

      RAISE NOTICE 'Usuario migrado: % (%)', v_user.email, v_user.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error migrando usuario %: %', v_user.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- PASO 5: VERIFICACIÓN FINAL
-- ============================================

SELECT 
  '✅ USUARIOS MIGRADOS' as resultado,
  COUNT(*) as total
FROM user_profiles;

SELECT 
  '✅ ORGANIZACIONES CREADAS' as resultado,
  COUNT(*) as total
FROM organizations;

SELECT 
  '✅ MIEMBROS DE EQUIPO' as resultado,
  COUNT(*) as total
FROM team_members;

SELECT 
  '✅ POLÍTICAS RLS' as resultado,
  COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'user_profiles', 'team_members', 'team_invitations');

-- Ver todos los usuarios con sus datos
SELECT 
  '📊 RESUMEN DE USUARIOS' as seccion,
  au.email,
  up.role,
  o.name as organizacion,
  tm.status as estado_miembro
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
LEFT JOIN team_members tm ON tm.user_id = au.id AND tm.organization_id = o.id
ORDER BY au.created_at;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ INSTALACIÓN COMPLETA FINALIZADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TODO LISTO! Ahora:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Cierra sesión en tu aplicación';
  RAISE NOTICE '2. Limpia el caché del navegador:';
  RAISE NOTICE '   - Presiona Ctrl+Shift+Delete';
  RAISE NOTICE '   - Selecciona "Cookies" y "Caché"';
  RAISE NOTICE '   - Selecciona "Todo el tiempo"';
  RAISE NOTICE '   - Click en "Borrar datos"';
  RAISE NOTICE '3. CIERRA el navegador completamente';
  RAISE NOTICE '4. Abre el navegador e inicia sesión';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Deberías ver:';
  RAISE NOTICE '   - 👥 Equipo en el menú lateral';
  RAISE NOTICE '   - 👑 Propietario como tu rol';
  RAISE NOTICE '   - Botón "Invitar Miembro"';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
