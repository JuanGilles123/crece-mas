-- 🔐 Políticas RLS para la tabla productos
-- Ejecutar en Supabase SQL Editor
-- 
-- ⚠️ IMPORTANTE: Asegúrate de que la tabla productos tenga RLS habilitado:
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. POLÍTICA SELECT: Ver productos de la organización
-- ============================================
DROP POLICY IF EXISTS "Users can view productos from their organization" ON productos;
CREATE POLICY "Users can view productos from their organization"
  ON productos FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- 2. POLÍTICA INSERT: Crear productos (cualquier usuario activo de la organización)
-- ============================================
DROP POLICY IF EXISTS "Active users can insert productos" ON productos;
CREATE POLICY "Active users can insert productos"
  ON productos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = productos.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = productos.organization_id
      AND status = 'active'
    )
  );

-- ============================================
-- 3. POLÍTICA UPDATE: Actualizar productos (cualquier usuario activo de la organización)
-- ============================================
DROP POLICY IF EXISTS "Users can update productos from their organization" ON productos;
CREATE POLICY "Users can update productos from their organization"
  ON productos FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- 4. POLÍTICA DELETE: Eliminar productos (solo owners/admins)
-- ============================================
DROP POLICY IF EXISTS "Owners and admins can delete productos" ON productos;
CREATE POLICY "Owners and admins can delete productos"
  ON productos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = productos.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = productos.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON POLICY "Users can view productos from their organization" ON productos IS 
  'Permite a usuarios ver productos de su organización';
COMMENT ON POLICY "Active users can insert productos" ON productos IS 
  'Permite a usuarios activos crear productos en su organización';
COMMENT ON POLICY "Users can update productos from their organization" ON productos IS 
  'Permite a usuarios actualizar productos de su organización';
COMMENT ON POLICY "Owners and admins can delete productos" ON productos IS 
  'Solo owners y admins pueden eliminar productos';
