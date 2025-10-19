-- ============================================
-- ARREGLO FINAL: Política INSERT para team_members
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- PASO 1: Verificar políticas actuales
SELECT 
  '📋 POLÍTICAS ACTUALES DE TEAM_MEMBERS' as info,
  policyname,
  cmd as tipo,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ INSERT permitido'
    ELSE ''
  END as nota
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'team_members'
ORDER BY cmd, policyname;

-- PASO 2: Eliminar política INSERT si existe (para recrearla)
DROP POLICY IF EXISTS "team_members_accept_invitation" ON team_members;

-- PASO 3: Crear política INSERT que permite aceptar invitaciones
CREATE POLICY "team_members_accept_invitation" ON team_members
  FOR INSERT 
  WITH CHECK (
    -- El usuario debe estar autenticado
    auth.uid() IS NOT NULL AND
    -- Solo puede agregar su propio user_id
    user_id = auth.uid() AND
    -- Debe existir una invitación válida
    EXISTS (
      SELECT 1 FROM team_invitations ti
      WHERE ti.organization_id = team_members.organization_id
        AND ti.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ti.status = 'pending'
        AND ti.expires_at > NOW()
    )
  );

-- PASO 4: Verificar que se creó correctamente
SELECT 
  '✅ POLÍTICA INSERT CREADA' as resultado,
  policyname,
  cmd,
  CASE 
    WHEN policyname = 'team_members_accept_invitation' 
    THEN '✅ LISTO - Ahora puedes aceptar invitaciones'
    ELSE ''
  END as estado
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'team_members'
  AND cmd = 'INSERT';

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ POLÍTICA INSERT CONFIGURADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora los usuarios pueden:';
  RAISE NOTICE '✅ Aceptar invitaciones automáticamente';
  RAISE NOTICE '✅ Crear su registro en team_members';
  RAISE NOTICE '✅ Unirse a organizaciones';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRUEBA AHORA:';
  RAISE NOTICE '1. Limpia localStorage: localStorage.clear()';
  RAISE NOTICE '2. Abre link de invitación en incógnito';
  RAISE NOTICE '3. Crea cuenta o inicia sesión';
  RAISE NOTICE '4. Deberías ver "✅ Invitación aceptada"';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
