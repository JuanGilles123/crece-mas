-- 1. DATABASE HARDENING
-- Add new columns (nullable for existing records)
ALTER TABLE legal_acceptances
ADD COLUMN IF NOT EXISTS document_hash TEXT;

ALTER TABLE legal_acceptances
ADD COLUMN IF NOT EXISTS document_language TEXT DEFAULT 'es-CO';

ALTER TABLE legal_acceptances
ADD COLUMN IF NOT EXISTS app_version TEXT;

-- 2. UNIQUE constraint (user_id, document_type, document_version)
-- Remove duplicates safely: keep earliest
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id, document_type, document_version ORDER BY accepted_at ASC) AS rn
  FROM legal_acceptances
)
DELETE FROM legal_acceptances
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'legal_acceptances' AND constraint_type = 'UNIQUE'
      AND constraint_name = 'legal_acceptances_user_doc_ver_unique'
  ) THEN
    ALTER TABLE legal_acceptances
    ADD CONSTRAINT legal_acceptances_user_doc_ver_unique UNIQUE (user_id, document_type, document_version);
  END IF;
END$$;

-- End of migration
