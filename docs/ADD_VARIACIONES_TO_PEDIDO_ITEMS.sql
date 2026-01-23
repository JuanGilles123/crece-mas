-- Agregar columna variaciones_seleccionadas a pedido_items
-- Para guardar las opciones/variaciones seleccionadas por el cliente
-- Ejemplo: {"salsa": "mora", "arequipe": true}

DO $$
BEGIN
  -- Agregar columna variaciones_seleccionadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedido_items' AND column_name = 'variaciones_seleccionadas'
  ) THEN
    ALTER TABLE pedido_items
    ADD COLUMN variaciones_seleccionadas JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Columna variaciones_seleccionadas agregada exitosamente a pedido_items.';
  ELSE
    RAISE NOTICE 'La columna variaciones_seleccionadas ya existe en pedido_items.';
  END IF;

  -- Comentario para documentación
  COMMENT ON COLUMN pedido_items.variaciones_seleccionadas IS 'Variaciones/opciones seleccionadas por el cliente (ej: {"salsa": "mora", "arequipe": true})';

END $$;
