-- ============================================
-- LIMPIAR POLÍTICAS DUPLICADAS EN ORGANIZATIONS
-- ============================================
-- Elimina políticas antiguas que causan conflictos
-- ============================================

-- PASO 1: Ver políticas actuales
SELECT 
  '🔍 POLÍTICAS ANTES DE LIMPIAR' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'organizations'
ORDER BY cmd, policyname;

-- PASO 2: Eliminar políticas duplicadas antiguas
-- Mantener solo las políticas del script nuevo

-- Eliminar políticas SELECT antiguas (mantener team_members_view_organization)
DROP POLICY IF EXISTS "organizations_select" ON organizations;

-- Eliminar política UPDATE antigua (mantener owners_update_organization)
DROP POLICY IF EXISTS "organizations_update" ON organizations;

-- PASO 3: Recrear políticas necesarias correctamente

-- SELECT: Permitir a team members ver organizaciones
DROP POLICY IF EXISTS "team_members_view_organization" ON organizations;
CREATE POLICY "team_members_view_organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- UPDATE: Solo OWNERS pueden actualizar info de facturación
DROP POLICY IF EXISTS "owners_update_organization" ON organizations;
CREATE POLICY "owners_update_organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner' 
        AND status = 'active'
    )
  );

-- INSERT: Mantener política existente
-- (La política organizations_insert ya existe y funciona bien)

-- DELETE: Mantener política existente
-- (La política organizations_delete ya existe y funciona bien)

-- PASO 4: Verificar políticas limpias
SELECT 
  '✅ POLÍTICAS DESPUÉS DE LIMPIAR' as info,
  policyname,
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN '👥 Team members pueden ver'
    WHEN 'UPDATE' THEN '👑 Solo owners pueden actualizar'
    WHEN 'INSERT' THEN '➕ Crear organizaciones'
    WHEN 'DELETE' THEN '🗑️ Solo owner puede eliminar'
  END as descripcion
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'organizations'
ORDER BY cmd, policyname;

-- PASO 5: Probar SELECT (deberías ver tus organizaciones)
SELECT 
  '🧪 PRUEBA SELECT' as info,
  id,
  name,
  razon_social,
  email
FROM organizations
LIMIT 3;

-- PASO 6: Verificar que ConfiguracionFacturacion.js pueda cargar datos
SELECT 
  '✅ DATOS PARA CONFIGURACIÓN' as info,
  o.id,
  o.name as nombre_negocio,
  o.razon_social,
  o.nit,
  o.email,
  o.telefono,
  o.ciudad,
  o.regimen_tributario,
  o.responsable_iva,
  o.mensaje_factura,
  tm.role as tu_rol
FROM organizations o
INNER JOIN team_members tm ON tm.organization_id = o.id
WHERE tm.user_id = auth.uid() AND tm.status = 'active'
ORDER BY tm.created_at DESC;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
DECLARE
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'organizations';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ POLÍTICAS LIMPIADAS Y CONFIGURADAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total políticas activas: %', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '📋 POLÍTICAS ACTIVAS:';
  RAISE NOTICE '  SELECT → team_members_view_organization';
  RAISE NOTICE '  UPDATE → owners_update_organization';
  RAISE NOTICE '  INSERT → organizations_insert';
  RAISE NOTICE '  DELETE → organizations_delete';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AHORA PUEDES:';
  RAISE NOTICE '1. Abrir la aplicación';
  RAISE NOTICE '2. Navegar a Configuración de Facturación';
  RAISE NOTICE '3. Ver y editar info de facturación (si eres owner)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
