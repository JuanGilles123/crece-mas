ALTER TABLE inventory_import_items
ADD COLUMN IF NOT EXISTS review_state text NOT NULL DEFAULT 'pending';

ALTER TABLE inventory_import_items
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE inventory_import_items
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
