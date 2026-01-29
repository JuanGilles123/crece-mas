-- Inventory review history (sessions + items)
CREATE TABLE IF NOT EXISTS inventory_review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope_type text NOT NULL DEFAULT 'all',
  scope_value text,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS inventory_review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES inventory_review_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  reviewed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  reviewed_qty numeric NOT NULL,
  difference_qty numeric NOT NULL,
  status text NOT NULL,
  review_state text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_review_sessions_org_idx
  ON inventory_review_sessions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_review_sessions_status_idx
  ON inventory_review_sessions(status);
CREATE INDEX IF NOT EXISTS inventory_review_items_org_idx
  ON inventory_review_items(organization_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS inventory_review_items_product_idx
  ON inventory_review_items(product_id);
CREATE INDEX IF NOT EXISTS inventory_review_items_session_idx
  ON inventory_review_items(session_id);

ALTER TABLE inventory_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_review_items ENABLE ROW LEVEL SECURITY;

-- Sessions policies
DROP POLICY IF EXISTS "Users can view inventory review sessions" ON inventory_review_sessions;
CREATE POLICY "Users can view inventory review sessions"
  ON inventory_review_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Active users can insert inventory review sessions" ON inventory_review_sessions;
CREATE POLICY "Active users can insert inventory review sessions"
  ON inventory_review_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update inventory review sessions" ON inventory_review_sessions;
CREATE POLICY "Owners and admins can update inventory review sessions"
  ON inventory_review_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_sessions.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Items policies
DROP POLICY IF EXISTS "Users can view inventory review items" ON inventory_review_items;
CREATE POLICY "Users can view inventory review items"
  ON inventory_review_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Active users can insert inventory review items" ON inventory_review_items;
CREATE POLICY "Active users can insert inventory review items"
  ON inventory_review_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update inventory review items" ON inventory_review_items;
CREATE POLICY "Owners and admins can update inventory review items"
  ON inventory_review_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = inventory_review_items.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );
