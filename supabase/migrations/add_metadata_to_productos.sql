-- Agregar columna metadata para campos adicionales de productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Actualizar el tipo para incluir los nuevos tipos de productos
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_tipo_check;

ALTER TABLE productos 
ADD CONSTRAINT productos_tipo_check 
CHECK (tipo IN ('fisico', 'servicio', 'comida', 'accesorio'));

-- Comentarios para documentación
COMMENT ON COLUMN productos.metadata IS 'Campos adicionales del producto almacenados en formato JSON (marca, modelo, color, talla, peso, dimensiones, etc.)';
COMMENT ON COLUMN productos.tipo IS 'Tipo de producto: fisico (con stock), servicio (intangible), comida (alimenticio), accesorio (con peso/variables)';
