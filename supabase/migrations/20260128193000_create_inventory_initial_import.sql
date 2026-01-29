-- Initial inventory import (collaborative batches + items)
CREATE TABLE IF NOT EXISTS inventory_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES inventory_import_batches(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo text,
  nombre text NOT NULL,
  precio_compra numeric NOT NULL DEFAULT 0,
  precio_venta numeric NOT NULL,
  stock numeric,
  tipo text NOT NULL DEFAULT 'fisico',
  metadata jsonb,
  review_state text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  return_reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_import_batches_org_idx
  ON inventory_import_batches(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_import_batches_status_idx
  ON inventory_import_batches(status);
CREATE INDEX IF NOT EXISTS inventory_import_items_org_idx
  ON inventory_import_items(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_import_items_batch_idx
  ON inventory_import_items(batch_id);

ALTER TABLE inventory_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_import_items ENABLE ROW LEVEL SECURITY;

-- Batches: SELECT for org members
DROP POLICY IF EXISTS "Users can view inventory import batches" ON inventory_import_batches;
CREATE POLICY "Users can view inventory import batches"
  ON inventory_import_batches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Batches: INSERT for active users in org
DROP POLICY IF EXISTS "Active users can insert inventory import batches" ON inventory_import_batches;
CREATE POLICY "Active users can insert inventory import batches"
  ON inventory_import_batches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_batches.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_batches.organization_id
      AND status = 'active'
    )
  );

-- Batches: UPDATE for creators/assignees; approve only owners/admins
DROP POLICY IF EXISTS "Users can update inventory import batches" ON inventory_import_batches;
CREATE POLICY "Users can update inventory import batches"
  ON inventory_import_batches FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (created_by = auth.uid() OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND organization_id = inventory_import_batches.organization_id
        AND role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND organization_id = inventory_import_batches.organization_id
        AND status = 'active'
        AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    status <> 'approved'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_batches.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_batches.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Items: SELECT for org members
DROP POLICY IF EXISTS "Users can view inventory import items" ON inventory_import_items;
CREATE POLICY "Users can view inventory import items"
  ON inventory_import_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Items: INSERT for active users in org
DROP POLICY IF EXISTS "Active users can insert inventory import items" ON inventory_import_items;
CREATE POLICY "Active users can insert inventory import items"
  ON inventory_import_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_items.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_import_items.organization_id
      AND status = 'active'
    )
  );

-- Items: UPDATE for creators or admins
DROP POLICY IF EXISTS "Users can update inventory import items" ON inventory_import_items;
CREATE POLICY "Users can update inventory import items"
  ON inventory_import_items FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND organization_id = inventory_import_items.organization_id
        AND role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND organization_id = inventory_import_items.organization_id
        AND status = 'active'
        AND role IN ('owner', 'admin')
      )
    )
  );
