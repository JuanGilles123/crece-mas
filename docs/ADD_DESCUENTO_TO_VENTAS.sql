-- Agregar columna de descuento a la tabla ventas
-- Ejecutar en Supabase SQL Editor

-- Agregar columna descuento (JSONB para almacenar información del descuento)
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS descuento JSONB DEFAULT NULL;

-- Agregar columna subtotal (para tener el total antes del descuento)
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN ventas.descuento IS 'Información del descuento aplicado: {tipo: "porcentaje"|"fijo", valor: number, monto: number, alcance: "total"|"productos", productosIds: array}';
COMMENT ON COLUMN ventas.subtotal IS 'Subtotal de la venta antes de aplicar descuentos';

-- Índice para búsquedas por descuento (opcional, solo si necesitas filtrar ventas con descuento)
CREATE INDEX IF NOT EXISTS idx_ventas_descuento ON ventas USING GIN (descuento) WHERE descuento IS NOT NULL;
