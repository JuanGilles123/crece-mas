-- 🔍 INSPECCIÓN DE LA ESTRUCTURA ACTUAL
-- Ejecuta PRIMERO este script para ver cómo está tu tabla ventas

-- Ver todas las columnas de la tabla ventas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ventas'
ORDER BY ordinal_position;

-- Ver las relaciones/foreign keys de la tabla ventas
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='ventas';

-- Ver un ejemplo de datos (si hay)
SELECT * FROM ventas LIMIT 3;
