-- Agregar columna 'tipo' y permitir NULL en 'stock' para toppings
-- Esto permite soportar tanto toppings de comida (con stock) como servicios adicionales (sin stock)

-- Agregar columna 'tipo' si no existe
ALTER TABLE toppings 
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'comida' CHECK (tipo IN ('comida', 'servicio'));

-- Permitir NULL en stock (para servicios que no requieren inventario)
ALTER TABLE toppings 
ALTER COLUMN stock DROP NOT NULL;

-- Actualizar comentarios
COMMENT ON COLUMN toppings.tipo IS 'Tipo de adicional: comida (ingrediente con stock) o servicio (extra sin stock)';
COMMENT ON COLUMN toppings.stock IS 'Cantidad disponible en stock (NULL para servicios)';

