-- Agregar campo 'estado' a la tabla ventas para soportar cotizaciones
-- Ejecutar en Supabase SQL Editor

-- Agregar columna 'estado' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'estado'
  ) THEN
    ALTER TABLE ventas 
    ADD COLUMN estado VARCHAR(20) DEFAULT 'completada' 
    CHECK (estado IN ('completada', 'cotizacion'));
    
    -- Crear índice para mejorar consultas de cotizaciones
    CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(organization_id, estado);
    
    RAISE NOTICE 'Campo estado agregado exitosamente';
  ELSE
    RAISE NOTICE 'El campo estado ya existe';
  END IF;
END $$;

-- Agregar campos adicionales para cotizaciones si no existen
DO $$ 
BEGIN
  -- Campo subtotal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE ventas ADD COLUMN subtotal DECIMAL(10, 2);
    RAISE NOTICE 'Campo subtotal agregado';
  END IF;
  
  -- Campo impuestos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'impuestos'
  ) THEN
    ALTER TABLE ventas ADD COLUMN impuestos DECIMAL(10, 2);
    RAISE NOTICE 'Campo impuestos agregado';
  END IF;
  
  -- Campo incluir_iva
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'incluir_iva'
  ) THEN
    ALTER TABLE ventas ADD COLUMN incluir_iva BOOLEAN DEFAULT false;
    RAISE NOTICE 'Campo incluir_iva agregado';
  END IF;
  
  -- Campo porcentaje_iva
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'porcentaje_iva'
  ) THEN
    ALTER TABLE ventas ADD COLUMN porcentaje_iva DECIMAL(5, 2) DEFAULT 19;
    RAISE NOTICE 'Campo porcentaje_iva agregado';
  END IF;
  
  -- Campo notas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'notas'
  ) THEN
    ALTER TABLE ventas ADD COLUMN notas TEXT;
    RAISE NOTICE 'Campo notas agregado';
  END IF;
END $$;
