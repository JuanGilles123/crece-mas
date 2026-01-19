-- Diagnóstico de productos - Verificar por qué no cargan todos

-- 1. Contar total de productos por usuario
SELECT 
    user_id,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as productos_recientes
FROM public.productos 
GROUP BY user_id
ORDER BY total_productos DESC;

-- 2. Verificar los últimos productos creados
SELECT 
    id,
    nombre,
    user_id,
    created_at
FROM public.productos 
ORDER BY created_at DESC 
LIMIT 50;

-- 3. Verificar si hay productos con user_id nulo
SELECT COUNT(*) as productos_sin_usuario
FROM public.productos 
WHERE user_id IS NULL;

-- 4. Verificar políticas RLS para productos
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'productos';

-- 5. Verificar si RLS está habilitado
SELECT relrowsecurity FROM pg_class WHERE relname = 'productos';

-- 6. Contar productos por fecha (últimos 7 días)
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as productos_creados
FROM public.productos 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
