-- Agregar campos de posición y forma a la tabla mesas
-- Para la vista de planta interactiva

-- Agregar columna de forma (redonda o cuadrada)
ALTER TABLE mesas 
ADD COLUMN IF NOT EXISTS forma VARCHAR(10) DEFAULT 'redonda' CHECK (forma IN ('redonda', 'cuadrada'));

-- Agregar columnas de posición (coordenadas en la vista de planta)
ALTER TABLE mesas 
ADD COLUMN IF NOT EXISTS posicion_x INTEGER DEFAULT 0;

ALTER TABLE mesas 
ADD COLUMN IF NOT EXISTS posicion_y INTEGER DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN mesas.forma IS 'Forma de la mesa: redonda o cuadrada';
COMMENT ON COLUMN mesas.posicion_x IS 'Posición X en la vista de planta (píxeles)';
COMMENT ON COLUMN mesas.posicion_y IS 'Posición Y en la vista de planta (píxeles)';

