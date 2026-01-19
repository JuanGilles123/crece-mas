-- Script para obtener tu user_id actual

-- 1. Obtener tu user_id
SELECT auth.uid() as mi_user_id;

-- 2. Obtener información de tu usuario
SELECT 
    id,
    email,
    created_at,
    user_metadata
FROM auth.users 
WHERE id = auth.uid();
