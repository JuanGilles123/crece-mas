-- Script para agregar columnas de ancho y alto a la tabla mesas
-- Para permitir redimensionar barras y mesas cuadradas

DO $$
BEGIN
  -- Agregar columna ancho
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'ancho'
  ) THEN
    ALTER TABLE mesas
    ADD COLUMN ancho INTEGER DEFAULT 80;
    
    RAISE NOTICE 'Columna ancho agregada exitosamente a la tabla mesas.';
  ELSE
    RAISE NOTICE 'La columna ancho ya existe en la tabla mesas.';
  END IF;

  -- Agregar columna alto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'alto'
  ) THEN
    ALTER TABLE mesas
    ADD COLUMN alto INTEGER DEFAULT 80;
    
    RAISE NOTICE 'Columna alto agregada exitosamente a la tabla mesas.';
  ELSE
    RAISE NOTICE 'La columna alto ya existe en la tabla mesas.';
  END IF;

  -- Comentarios para documentación
  COMMENT ON COLUMN mesas.ancho IS 'Ancho de la mesa/barra en píxeles (solo para formas cuadradas o barras)';
  COMMENT ON COLUMN mesas.alto IS 'Alto de la mesa/barra en píxeles (solo para formas cuadradas o barras)';

END $$;
