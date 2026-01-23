-- Agregar columna variaciones_config a productos
-- Para definir las variaciones disponibles por producto
-- Ejemplo: [{"nombre": "Salsa", "opciones": ["Mora", "Melocotón", "Ninguna"], "requerido": true}]

DO $$
BEGIN
  -- Agregar columna variaciones_config en metadata (si no existe metadata, se crea)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE productos
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Columna metadata agregada exitosamente a productos.';
  ELSE
    RAISE NOTICE 'La columna metadata ya existe en productos.';
  END IF;

  -- Comentario para documentación
  COMMENT ON COLUMN productos.metadata IS 'Metadatos del producto incluyendo variaciones_config para opciones del cliente';

END $$;
