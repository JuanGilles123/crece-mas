-- Script para cambiar el tipo de dato de la columna stock de integer a numeric
-- Esto permite manejar productos vinculados con cantidades fraccionadas (porciones)

-- PASO 1: Eliminar todas las vistas que dependen de la columna stock
-- Esto es necesario porque PostgreSQL no permite cambiar el tipo de una columna
-- que está siendo usada por una vista o regla
DROP VIEW IF EXISTS productos_proximos_vencer CASCADE;
DROP VIEW IF EXISTS productos_vencidos CASCADE;

-- También eliminar cualquier otra vista que pueda depender de stock
-- (Esto es seguro, las recrearemos después)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT viewname 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND definition LIKE '%stock%'
      AND viewname NOT IN ('productos_proximos_vencer', 'productos_vencidos')
  LOOP
    EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
    RAISE NOTICE 'Vista eliminada: %', r.viewname;
  END LOOP;
END $$;

-- PASO 2: Cambiar stock de productos a numeric(10,2) para permitir decimales
ALTER TABLE productos 
ALTER COLUMN stock TYPE numeric(10,2) USING stock::numeric(10,2);

-- PASO 3: Cambiar stock de toppings a numeric(10,2) para permitir decimales (si existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'toppings' AND column_name = 'stock'
  ) THEN
    ALTER TABLE toppings 
    ALTER COLUMN stock TYPE numeric(10,2) USING stock::numeric(10,2);
  END IF;
END $$;

-- PASO 4: Recrear las vistas eliminadas
-- Recrear productos_proximos_vencer
CREATE OR REPLACE VIEW productos_proximos_vencer AS
SELECT 
  id,
  nombre,
  codigo,
  stock,
  fecha_vencimiento,
  organization_id,
  created_at
FROM productos
WHERE fecha_vencimiento IS NOT NULL
  AND fecha_vencimiento >= CURRENT_DATE
  AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
  AND stock IS NOT NULL
  AND stock > 0;

-- Recrear productos_vencidos
CREATE OR REPLACE VIEW productos_vencidos AS
SELECT 
  id,
  nombre,
  codigo,
  stock,
  fecha_vencimiento,
  organization_id,
  created_at
FROM productos
WHERE fecha_vencimiento IS NOT NULL
  AND fecha_vencimiento < CURRENT_DATE
  AND stock IS NOT NULL
  AND stock > 0;

-- Verificar el cambio
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'productos' AND column_name = 'stock';

-- Comentario para documentación
COMMENT ON COLUMN productos.stock IS 'Cantidad disponible en stock (puede ser fraccionada para productos vinculados con porciones)';
