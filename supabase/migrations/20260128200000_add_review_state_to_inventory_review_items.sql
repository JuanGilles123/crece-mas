ALTER TABLE inventory_review_items
ADD COLUMN IF NOT EXISTS review_state text NOT NULL DEFAULT 'pending';
