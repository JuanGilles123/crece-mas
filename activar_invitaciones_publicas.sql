-- ============================================
-- ACTIVAR INVITACIONES PÚBLICAS - SCRIPT RÁPIDO
-- ============================================
-- Ejecuta este script en Supabase SQL Editor
-- para activar el sistema de invitaciones públicas
-- ============================================

-- SOLO SI AÚN NO EJECUTASTE fix_invitations_policies.sql:
-- Ejecuta ese script completo primero.

-- SI YA EJECUTASTE fix_invitations_policies.sql ANTES:
-- Solo necesitas ejecutar esto para agregar la política pública:

-- Verificar políticas existentes
SELECT 
  '📋 POLÍTICAS ACTUALES' as info,
  policyname,
  cmd as tipo
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'team_invitations'
ORDER BY policyname;

-- Agregar política pública (si no existe)
DO $$
BEGIN
  -- Verificar si ya existe la política pública
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'team_invitations'
      AND policyname = 'team_invitations_public_select'
  ) THEN
    -- Crear política pública
    EXECUTE '
      CREATE POLICY "team_invitations_public_select" ON team_invitations
        FOR SELECT 
        USING (true)
    ';
    RAISE NOTICE '✅ Política pública creada: team_invitations_public_select';
  ELSE
    RAISE NOTICE '⚠️  Política pública ya existe: team_invitations_public_select';
  END IF;
END $$;

-- Verificación final
SELECT 
  '✅ POLÍTICAS FINALES' as info,
  policyname,
  cmd as tipo,
  qual as condicion
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'team_invitations'
ORDER BY policyname;

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ INVITACIONES PÚBLICAS ACTIVADAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ya puedes usar el sistema completo:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Ve a /dashboard/equipo';
  RAISE NOTICE '2. Crea una invitación';
  RAISE NOTICE '3. Copia el link: /invite/TOKEN';
  RAISE NOTICE '4. Compártelo con quien quieras';
  RAISE NOTICE '5. ¡Funcionará SIN necesidad de cuenta previa!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
