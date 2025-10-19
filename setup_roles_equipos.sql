-- ============================================
-- SISTEMA DE ROLES Y EQUIPOS PARA CRECE+
-- ============================================
-- Este script crea toda la infraestructura necesaria para:
-- - Gestión de roles de usuario
-- - Invitaciones a equipos
-- - Relaciones empresa-empleados
-- - Control de permisos
-- ============================================

-- ============================================
-- 1. TABLA: user_profiles
-- Almacena el perfil y rol principal de cada usuario
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'cashier', 'inventory_manager', 'viewer')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  organization_id UUID, -- ID de la organización principal (para owners)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON user_profiles(organization_id);

-- ============================================
-- 2. TABLA: organizations
-- Representa las empresas/negocios
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT, -- 'food', 'clothing', 'retail', 'other'
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  max_team_members INTEGER DEFAULT 3, -- Límite según el plan
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- ============================================
-- 3. TABLA: team_members
-- Relación entre usuarios y organizaciones
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier', 'inventory_manager', 'viewer')),
  permissions JSONB DEFAULT '{}', -- Permisos personalizados adicionales
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================
-- 4. TABLA: team_invitations
-- Gestión de invitaciones pendientes
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'inventory_manager', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  message TEXT, -- Mensaje personalizado de invitación
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invitations_org ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON team_invitations(status);

-- ============================================
-- 5. FUNCIÓN: Crear organización automáticamente al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile_and_organization()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
BEGIN
  -- Obtener el nombre de la organización desde metadata o usar email
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    'Negocio de ' || COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- Crear organización
  INSERT INTO organizations (owner_id, name, business_type)
  VALUES (
    NEW.id,
    org_name,
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'retail')
  )
  RETURNING id INTO org_id;

  -- Crear perfil de usuario como owner
  INSERT INTO user_profiles (
    user_id,
    role,
    full_name,
    phone,
    organization_id
  ) VALUES (
    NEW.id,
    'owner',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    org_id
  );

  -- Agregar como miembro del equipo con rol owner
  INSERT INTO team_members (
    organization_id,
    user_id,
    role,
    invited_by,
    permissions
  ) VALUES (
    org_id,
    NEW.id,
    'owner',
    NEW.id,
    '{"all": true}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil y organización
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_and_organization();

-- ============================================
-- 6. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- POLÍTICAS: organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.organization_id = organizations.id
      AND team_members.user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;
CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their organizations" ON organizations;
CREATE POLICY "Owners can delete their organizations" ON organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- POLÍTICAS: team_members
DROP POLICY IF EXISTS "Team members can view team" ON team_members;
CREATE POLICY "Team members can view team" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and admins can manage team" ON team_members;
CREATE POLICY "Owners and admins can manage team" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

-- POLÍTICAS: team_invitations
DROP POLICY IF EXISTS "Team can view invitations" ON team_invitations;
CREATE POLICY "Team can view invitations" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and admins can create invitations" ON team_invitations;
CREATE POLICY "Owners and admins can create invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update invitations sent to them" ON team_invitations;
CREATE POLICY "Users can update invitations sent to them" ON team_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

-- ============================================
-- 8. FUNCIÓN: Aceptar invitación
-- ============================================
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record RECORD;
  user_email TEXT;
  result JSONB;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  -- Buscar invitación
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
    AND email = user_email
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no encontrada, expirada o ya aceptada'
    );
  END IF;

  -- Verificar límite de miembros
  IF (
    SELECT COUNT(*) FROM team_members
    WHERE organization_id = invitation_record.organization_id
    AND status = 'active'
  ) >= (
    SELECT max_team_members FROM organizations
    WHERE id = invitation_record.organization_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La organización ha alcanzado el límite de miembros'
    );
  END IF;

  -- Agregar como miembro del equipo
  INSERT INTO team_members (
    organization_id,
    user_id,
    role,
    invited_by,
    status
  ) VALUES (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role,
    invitation_record.invited_by,
    'active'
  );

  -- Actualizar perfil del usuario
  UPDATE user_profiles
  SET role = invitation_record.role
  WHERE user_id = auth.uid();

  -- Marcar invitación como aceptada
  UPDATE team_invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNCIÓN: Obtener permisos del usuario
-- ============================================
CREATE OR REPLACE FUNCTION get_user_permissions(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  user_perms JSONB;
BEGIN
  -- Obtener rol y permisos del usuario en la organización
  SELECT role, permissions INTO user_role, user_perms
  FROM team_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN '{"access": false}'::jsonb;
  END IF;

  -- Permisos por defecto según el rol
  CASE user_role
    WHEN 'owner' THEN
      RETURN jsonb_build_object(
        'access', true,
        'role', user_role,
        'permissions', jsonb_build_object(
          'dashboard', true,
          'sales', true,
          'inventory', true,
          'reports', true,
          'settings', true,
          'team', true,
          'billing', true
        )
      );
    WHEN 'admin' THEN
      RETURN jsonb_build_object(
        'access', true,
        'role', user_role,
        'permissions', jsonb_build_object(
          'dashboard', true,
          'sales', true,
          'inventory', true,
          'reports', true,
          'settings', true,
          'team', true,
          'billing', false
        )
      );
    WHEN 'cashier' THEN
      RETURN jsonb_build_object(
        'access', true,
        'role', user_role,
        'permissions', jsonb_build_object(
          'dashboard', false,
          'sales', true,
          'inventory', false,
          'reports', false,
          'settings', false,
          'team', false,
          'billing', false
        )
      );
    WHEN 'inventory_manager' THEN
      RETURN jsonb_build_object(
        'access', true,
        'role', user_role,
        'permissions', jsonb_build_object(
          'dashboard', true,
          'sales', true,
          'inventory', true,
          'reports', false,
          'settings', false,
          'team', false,
          'billing', false
        )
      );
    WHEN 'viewer' THEN
      RETURN jsonb_build_object(
        'access', true,
        'role', user_role,
        'permissions', jsonb_build_object(
          'dashboard', true,
          'sales', false,
          'inventory', false,
          'reports', true,
          'settings', false,
          'team', false,
          'billing', false
        )
      );
    ELSE
      RETURN '{"access": false}'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VISTA: Información completa de miembros
-- ============================================
CREATE OR REPLACE VIEW team_members_detailed AS
SELECT 
  tm.id,
  tm.organization_id,
  tm.user_id,
  tm.role,
  tm.permissions,
  tm.status,
  tm.joined_at,
  up.full_name,
  up.phone,
  up.avatar_url,
  au.email,
  o.name as organization_name,
  inviter.raw_user_meta_data->>'full_name' as invited_by_name
FROM team_members tm
JOIN user_profiles up ON tm.user_id = up.user_id
JOIN auth.users au ON tm.user_id = au.id
JOIN organizations o ON tm.organization_id = o.id
LEFT JOIN auth.users inviter ON tm.invited_by = inviter.id;

-- ============================================
-- COMPLETADO
-- ============================================
-- Para aplicar este script:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Pega este código completo
-- 3. Ejecuta (Run)
-- 
-- Esto creará:
-- ✅ Tablas para roles, organizaciones, equipos e invitaciones
-- ✅ Triggers automáticos para nuevos usuarios
-- ✅ Políticas RLS de seguridad
-- ✅ Funciones para gestionar invitaciones y permisos
-- ============================================
