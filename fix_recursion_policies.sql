-- ============================================
-- ARREGLAR RECURSIÓN INFINITA EN POLÍTICAS RLS
-- ============================================
-- Este script elimina las políticas recursivas y crea unas más simples
-- ============================================

-- PASO 1: DESACTIVAR RLS TEMPORALMENTE
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "team_members_select" ON team_members;

-- PASO 3: CREAR POLÍTICAS SIN RECURSIÓN
-- ============================================

-- USER_PROFILES: Política simple sin recursión
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);
  -- Cada usuario solo puede ver su propio perfil

-- TEAM_MEMBERS: Política simple sin recursión
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT 
  USING (auth.uid() = user_id);
  -- Cada usuario solo puede ver sus propias membresías

-- PASO 4: REACTIVAR RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- PASO 5: VERIFICACIÓN
SELECT 
  '✅ POLÍTICAS ACTUALIZADAS' as resultado,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'team_members')
ORDER BY tablename, policyname;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ RECURSIÓN ARREGLADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas simplificadas:';
  RAISE NOTICE '✅ user_profiles: Solo ver tu propio perfil';
  RAISE NOTICE '✅ team_members: Solo ver tus propias membresías';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AHORA:';
  RAISE NOTICE '1. Recarga la página en el navegador (F5)';
  RAISE NOTICE '2. Deberías ver el menú "Equipo"';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
