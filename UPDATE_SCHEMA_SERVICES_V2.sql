-- 1. Modificar tabla PRODUCTOS
-- Agregar columna 'tipo'
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'fisico' CHECK (tipo IN ('fisico', 'servicio'));

-- Hacer 'stock' opcional (NULLABLE) para permitir servicios sin stock
ALTER TABLE productos 
ALTER COLUMN stock DROP NOT NULL;

-- 2. Modificar tabla TOPPINGS
-- Agregar columna 'tipo'
ALTER TABLE toppings 
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'comida' CHECK (tipo IN ('comida', 'servicio'));

-- Hacer 'stock' opcional (NULLABLE) para permitir adicionales sin stock
ALTER TABLE toppings 
ALTER COLUMN stock DROP NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN productos.tipo IS 'Tipo de item: fisico (con stock) o servicio (intangible)';
COMMENT ON COLUMN toppings.tipo IS 'Tipo de adicional: comida (ingrediente) o servicio (extra)';
