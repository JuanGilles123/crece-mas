-- Script para verificar productos automáticamente
-- Este script usa auth.uid() para obtener el usuario actual

-- 1. Contar productos del usuario actual
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as productos_recientes
FROM public.productos 
WHERE user_id = auth.uid();

-- 2. Ver todos los productos del usuario actual
SELECT 
    id,
    nombre,
    precio_venta,
    stock,
    created_at
FROM public.productos 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 3. Verificar si hay productos duplicados
SELECT 
    nombre,
    COUNT(*) as cantidad
FROM public.productos 
WHERE user_id = auth.uid()
GROUP BY nombre
HAVING COUNT(*) > 1;

-- 4. Verificar políticas RLS para productos
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'productos';

-- 5. Verificar si RLS está habilitado
SELECT relrowsecurity FROM pg_class WHERE relname = 'productos';
