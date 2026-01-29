-- Unicidad de codigo por organizacion en productos
-- Ejecutar en Supabase SQL Editor

-- 1) Normalizar codigos vacios/espacios (opcional, recomendado)
UPDATE productos
SET codigo = TRIM(codigo)
WHERE codigo IS NOT NULL;

-- 2) Crear indice unico por organizacion y codigo (ignora nulos/vacios)
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_org_codigo_unique
ON productos (organization_id, codigo)
WHERE codigo IS NOT NULL AND codigo <> '';

