-- Agregar columna categoria a la tabla productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'General';

-- Actualizar productos existentes que no tengan categoria
UPDATE productos SET categoria = 'General' WHERE categoria IS NULL;
