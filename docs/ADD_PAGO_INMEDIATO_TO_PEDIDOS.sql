-- Script para agregar la columna 'pago_inmediato' a la tabla 'pedidos'
-- Ejecutar en Supabase SQL Editor

DO $$ 
BEGIN
  -- Agregar columna pago_inmediato
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'pago_inmediato'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN pago_inmediato BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Columna pago_inmediato agregada exitosamente a la tabla pedidos';
  ELSE
    RAISE NOTICE 'La columna pago_inmediato ya existe en la tabla pedidos';
  END IF;

  -- Actualizar comentarios
  COMMENT ON COLUMN pedidos.pago_inmediato IS 'Indica si el pedido se paga inmediatamente (true) o al final (false)';

  RAISE NOTICE 'Tabla pedidos actualizada exitosamente';
END $$;
