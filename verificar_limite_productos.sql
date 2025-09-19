-- Script para verificar límites en la consulta de productos

-- 1. Contar productos del usuario actual
SELECT 
    COUNT(*) as total_productos
FROM public.productos 
WHERE user_id = auth.uid();

-- 2. Ver productos con límite de 1000 (límite por defecto de Supabase)
SELECT 
    COUNT(*) as productos_con_limite_1000
FROM (
    SELECT *
    FROM public.productos 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1000
) as productos_limite;

-- 3. Ver productos con límite de 50 (posible límite personalizado)
SELECT 
    COUNT(*) as productos_con_limite_50
FROM (
    SELECT *
    FROM public.productos 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 50
) as productos_limite_50;

-- 4. Ver productos con límite de 30 (posible límite personalizado)
SELECT 
    COUNT(*) as productos_con_limite_30
FROM (
    SELECT *
    FROM public.productos 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 30
) as productos_limite_30;

-- 5. Ver los últimos 35 productos (para ver si hay algún problema con los más antiguos)
SELECT 
    id,
    nombre,
    created_at
FROM public.productos 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 35;
