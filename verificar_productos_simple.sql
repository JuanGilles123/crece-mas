-- Script simple para verificar productos

-- 1. Contar productos por usuario (reemplaza 'TU_USER_ID' con tu ID real)
SELECT 
    user_id,
    COUNT(*) as total_productos
FROM public.productos 
WHERE user_id = 'TU_USER_ID'  -- Reemplaza con tu user_id
GROUP BY user_id;

-- 2. Ver todos los productos del usuario (reemplaza 'TU_USER_ID' con tu ID real)
SELECT 
    id,
    nombre,
    precio_venta,
    stock,
    created_at
FROM public.productos 
WHERE user_id = 'TU_USER_ID'  -- Reemplaza con tu user_id
ORDER BY created_at DESC;

-- 3. Verificar si hay productos duplicados
SELECT 
    nombre,
    COUNT(*) as cantidad
FROM public.productos 
WHERE user_id = 'TU_USER_ID'  -- Reemplaza con tu user_id
GROUP BY nombre
HAVING COUNT(*) > 1;

-- 4. Verificar políticas RLS
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'productos';
