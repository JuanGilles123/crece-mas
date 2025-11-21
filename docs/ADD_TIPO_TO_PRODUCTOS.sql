-- Agregar columna 'tipo' a la tabla productos
-- Esto permite distinguir entre productos fisicos (con stock) y servicios (sin stock)

-- Agregar columna 'tipo' si no existe
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'fisico' CHECK (tipo IN ('fisico', 'servicio'));

-- Permitir NULL en stock (para servicios que no requieren inventario)
ALTER TABLE productos 
ALTER COLUMN stock DROP NOT NULL;

-- Actualizar comentarios
COMMENT ON COLUMN productos.tipo IS 'Tipo de item: fisico (con stock) o servicio (intangible)';
COMMENT ON COLUMN productos.stock IS 'Cantidad disponible en stock (NULL para servicios)';

