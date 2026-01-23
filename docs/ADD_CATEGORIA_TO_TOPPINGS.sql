-- Script para agregar categorías a toppings
-- Ejecutar en Supabase SQL Editor

DO $$ 
BEGIN
  -- Agregar columna categoria
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'toppings' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE toppings 
    ADD COLUMN categoria VARCHAR(50) DEFAULT 'general';
    
    -- Crear índice para mejorar consultas
    CREATE INDEX IF NOT EXISTS idx_toppings_categoria ON toppings(organization_id, categoria);
    
    -- Comentario para documentación
    COMMENT ON COLUMN toppings.categoria IS 'Categoría del topping (ej: salsas, adiciones, bebidas, etc.)';
    
    RAISE NOTICE 'Columna categoria agregada exitosamente a la tabla toppings';
  ELSE
    RAISE NOTICE 'La columna categoria ya existe en la tabla toppings';
  END IF;
END $$;
