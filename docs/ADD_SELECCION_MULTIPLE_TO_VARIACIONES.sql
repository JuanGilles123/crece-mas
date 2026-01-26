-- Agregar columnas seleccion_multiple y max_selecciones a la tabla variaciones
-- Esto permite configurar si una variación permite selección múltiple y cuántas opciones máximo

-- Agregar columna seleccion_multiple
ALTER TABLE variaciones 
ADD COLUMN IF NOT EXISTS seleccion_multiple BOOLEAN DEFAULT false;

-- Agregar columna max_selecciones
ALTER TABLE variaciones 
ADD COLUMN IF NOT EXISTS max_selecciones INTEGER;

-- Comentarios para documentación
COMMENT ON COLUMN variaciones.seleccion_multiple IS 'Si la variación permite seleccionar múltiples opciones (solo para tipo select)';
COMMENT ON COLUMN variaciones.max_selecciones IS 'Número máximo de opciones seleccionables (NULL = sin límite, solo aplica si seleccion_multiple = true)';
