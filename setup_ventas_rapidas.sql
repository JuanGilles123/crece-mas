-- Script para habilitar Ventas Rápidas
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, veamos la estructura actual de la tabla ventas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ventas'
ORDER BY ordinal_position;

-- 2. Agregar columna tipo_venta para diferenciar ventas normales de rápidas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS tipo_venta TEXT DEFAULT 'normal';

-- 3. Agregar CHECK constraint para tipo_venta (solo después de crear la columna)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ventas_tipo_venta_check'
  ) THEN
    ALTER TABLE ventas 
    ADD CONSTRAINT ventas_tipo_venta_check 
    CHECK (tipo_venta IN ('normal', 'rapida'));
  END IF;
END $$;

-- 4. Agregar columna descripcion para detalles de ventas rápidas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 5. Crear índice para optimizar consultas por tipo de venta
CREATE INDEX IF NOT EXISTS idx_ventas_tipo 
ON ventas(organization_id, tipo_venta, fecha DESC);

-- 6. Agregar comentarios para documentación
COMMENT ON COLUMN ventas.tipo_venta IS 'Tipo de venta: normal (con productos del inventario) o rapida (venta libre sin inventario)';
COMMENT ON COLUMN ventas.descripcion IS 'Descripción de la venta rápida o notas adicionales para cualquier tipo de venta';

-- 7. Actualizar ventas existentes (si las hay) para que tengan tipo_venta = 'normal'
UPDATE ventas 
SET tipo_venta = 'normal' 
WHERE tipo_venta IS NULL;

-- 8. Verificar la estructura actualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ventas'
ORDER BY ordinal_position;

-- 9. Mensaje de éxito
SELECT 
  '✅ Tabla ventas actualizada correctamente para soportar Ventas Rápidas' as resultado,
  'Columnas agregadas: tipo_venta (normal/rapida) y descripcion (TEXT)' as columnas_nuevas,
  'Ahora puedes registrar ventas rápidas sin necesidad de productos en inventario' as info;
