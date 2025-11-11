-- ============================================
-- FIX: Política RLS para VIP Admin Panel
-- Permite a usuarios VIP crear/editar cualquier suscripción
-- ============================================

-- Eliminar política restrictiva existente
DROP POLICY IF EXISTS "Solo owners y admins pueden insertar suscripciones" ON subscriptions;
DROP POLICY IF EXISTS "Solo owners y admins pueden actualizar suscripciones" ON subscriptions;

-- Nueva política para INSERT - permite a VIP o owners/admins
CREATE POLICY "VIP o owners pueden insertar suscripciones"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permitir si es VIP (tu email)
    auth.email() = 'juanjosegilarbelaez@gmail.com'
    OR
    -- O si es owner de la organización
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = subscriptions.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- O si es admin
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = subscriptions.organization_id
      AND team_members.role = 'Administrador'
      AND team_members.status = 'active'
    )
  );

-- Nueva política para UPDATE - permite a VIP o owners/admins
CREATE POLICY "VIP o owners pueden actualizar suscripciones"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    -- Permitir si es VIP (tu email)
    auth.email() = 'juanjosegilarbelaez@gmail.com'
    OR
    -- O si es owner de la organización
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = subscriptions.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- O si es admin
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = subscriptions.organization_id
      AND team_members.role = 'Administrador'
      AND team_members.status = 'active'
    )
  );

-- También permite DELETE para VIP
DROP POLICY IF EXISTS "Solo owners pueden eliminar suscripciones" ON subscriptions;

CREATE POLICY "VIP o owners pueden eliminar suscripciones"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (
    -- Permitir si es VIP (tu email)
    auth.email() = 'juanjosegilarbelaez@gmail.com'
    OR
    -- O si es owner de la organización
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = subscriptions.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Política para que VIP pueda ver todas las suscripciones
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia suscripción" ON subscriptions;

CREATE POLICY "VIP o usuarios pueden ver suscripciones"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    -- Permitir si es VIP (tu email)
    auth.email() = 'juanjosegilarbelaez@gmail.com'
    OR
    -- O si es miembro/owner de la organización
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY policyname;
