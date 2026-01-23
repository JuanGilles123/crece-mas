-- Agregar columna precio_compra a la tabla toppings
-- Para calcular la ganancia de los toppings

DO $$
BEGIN
  -- Agregar columna precio_compra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'toppings' AND column_name = 'precio_compra'
  ) THEN
    ALTER TABLE toppings
    ADD COLUMN precio_compra DECIMAL(10, 2) DEFAULT 0;
    
    RAISE NOTICE 'Columna precio_compra agregada exitosamente a la tabla toppings.';
  ELSE
    RAISE NOTICE 'La columna precio_compra ya existe en la tabla toppings.';
  END IF;

  -- Comentario para documentación
  COMMENT ON COLUMN toppings.precio_compra IS 'Precio de compra del topping para calcular ganancia';

END $$;
