-- Script SQL para agregar soporte de pago mixto a la tabla ventas
-- Este script es OPCIONAL. El sistema ya funciona sin esta columna.
-- Si decides ejecutarlo, tendrás los detalles del pago mixto en una columna separada.

-- Agregar columna para detalles de pago mixto (JSON)
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS detalles_pago_mixto JSONB;

-- Comentario para la columna
COMMENT ON COLUMN ventas.detalles_pago_mixto IS 'Detalles del pago mixto: metodo1, metodo2, monto1, monto2';

-- Índice para búsquedas eficientes (opcional)
CREATE INDEX IF NOT EXISTS idx_ventas_pago_mixto 
ON ventas USING gin (detalles_pago_mixto);

-- Ejemplo de estructura JSON esperada:
-- {
--   "metodo1": "Efectivo",
--   "metodo2": "Transferencia",
--   "monto1": 600,
--   "monto2": 600
-- }

-- Para verificar que la columna se agregó correctamente:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'ventas' AND column_name = 'detalles_pago_mixto';
