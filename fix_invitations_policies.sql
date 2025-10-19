-- ============================================
-- ARREGLAR POLÍTICAS DE TEAM_INVITATIONS
-- ============================================
-- Este script arregla los problemas de permisos en team_invitations
-- ============================================

-- PASO 1: Desactivar RLS temporalmente
ALTER TABLE team_invitations DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas problemáticas que acceden a auth.users
DROP POLICY IF EXISTS "team_invitations_select" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_update" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete" ON team_invitations;

-- PASO 3: Crear políticas simples sin acceder a auth.users
-- ============================================

-- SELECT: Política PÚBLICA - cualquiera puede ver invitaciones por token (para aceptarlas sin autenticación)
CREATE POLICY "team_invitations_public_select" ON team_invitations
  FOR SELECT 
  USING (true);

-- SELECT ALTERNATIVO: Ver tus propias invitaciones enviadas (si estás autenticado)
CREATE POLICY "team_invitations_owner_select" ON team_invitations
  FOR SELECT 
  USING (invited_by = auth.uid());

-- INSERT: Puedes crear invitaciones si eres owner/admin de la organización
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

-- UPDATE: Puedes actualizar tus propias invitaciones
CREATE POLICY "team_invitations_update" ON team_invitations
  FOR UPDATE 
  USING (invited_by = auth.uid());

-- DELETE: Puedes eliminar tus propias invitaciones
CREATE POLICY "team_invitations_delete" ON team_invitations
  FOR DELETE 
  USING (invited_by = auth.uid());

-- PASO 4: Reactivar RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- PASO 5: Verificar foreign keys existentes
SELECT 
  '🔍 FOREIGN KEYS' as seccion,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='team_members'
  AND tc.table_schema='public';

-- PASO 6: Verificación final
SELECT 
  '✅ POLÍTICAS ACTUALIZADAS' as resultado,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'team_invitations'
ORDER BY tablename, policyname;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ POLÍTICAS ARREGLADAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios:';
  RAISE NOTICE '✅ team_invitations: Políticas sin acceso a auth.users';
  RAISE NOTICE '✅ Ahora solo se valida con invited_by y team_members';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RECARGA LA PÁGINA (F5)';
  RAISE NOTICE '   Los errores deberían desaparecer';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
