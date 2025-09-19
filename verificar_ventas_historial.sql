-- Script para verificar los datos de ventas y su estructura
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla ventas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ventas' 
ORDER BY ordinal_position;

-- 2. Verificar cuántas ventas hay
SELECT COUNT(*) as total_ventas FROM ventas;

-- 3. Ver las últimas 5 ventas con su estructura completa
SELECT 
    id,
    user_id,
    total,
    metodo_pago,
    items,
    fecha,
    created_at,
    pago_cliente
FROM ventas 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar la estructura de los items en JSON
SELECT 
    id,
    total,
    metodo_pago,
    jsonb_array_length(items) as cantidad_items,
    items
FROM ventas 
WHERE items IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 3;

-- 5. Extraer un item específico para ver su estructura
SELECT 
    id,
    total,
    items->0 as primer_item,
    items->0->>'nombre' as nombre_producto,
    items->0->>'qty' as cantidad,
    items->0->>'precio_venta' as precio_venta
FROM ventas 
WHERE jsonb_array_length(items) > 0 
ORDER BY created_at DESC 
LIMIT 3;
