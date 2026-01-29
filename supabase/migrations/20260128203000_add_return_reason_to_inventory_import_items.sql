ALTER TABLE inventory_import_items
ADD COLUMN IF NOT EXISTS return_reason text;
