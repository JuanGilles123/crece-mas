-- Agregar campo 'numero_venta' a la tabla ventas
-- Ejecutar en Supabase SQL Editor

-- Agregar columna 'numero_venta' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'numero_venta'
  ) THEN
    ALTER TABLE ventas 
    ADD COLUMN numero_venta VARCHAR(50);
    
    -- Crear índice para mejorar consultas por número de venta
    CREATE INDEX IF NOT EXISTS idx_ventas_numero_venta ON ventas(organization_id, numero_venta);
    
    -- Crear índice único parcial para evitar duplicados por organización
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_numero_venta_unique 
    ON ventas(organization_id, numero_venta) 
    WHERE numero_venta IS NOT NULL;
    
    RAISE NOTICE 'Campo numero_venta agregado exitosamente';
  ELSE
    RAISE NOTICE 'El campo numero_venta ya existe';
  END IF;
END $$;
