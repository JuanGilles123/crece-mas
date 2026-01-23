-- Script para aumentar el tamaño del campo 'numero' en la tabla mesas
-- Para permitir nombres más largos como "Mostrador 1", "Barra 1", etc.

DO $$
BEGIN
  -- Verificar el tamaño actual y aumentarlo si es necesario
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'numero' AND character_maximum_length = 10
  ) THEN
    ALTER TABLE mesas
    ALTER COLUMN numero TYPE VARCHAR(50);
    
    RAISE NOTICE 'Campo numero actualizado de VARCHAR(10) a VARCHAR(50) exitosamente.';
  ELSE
    RAISE NOTICE 'El campo numero ya tiene un tamaño adecuado o no existe.';
  END IF;

  -- Comentario para documentación
  COMMENT ON COLUMN mesas.numero IS 'Número o nombre de la mesa/barra/mostrador (ej: "Mesa 1", "Barra 1", "Mostrador 1")';

END $$;
