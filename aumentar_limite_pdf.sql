-- AUMENTAR LÍMITE DE TAMAÑO PARA PDFs
-- Ejecutar en Supabase SQL Editor

-- 1. ACTUALIZAR LÍMITE DEL BUCKET DE RECIBOS
UPDATE storage.buckets 
SET file_size_limit = 52428800  -- 50MB en bytes
WHERE id = 'recibos';

-- 2. VERIFICAR EL CAMBIO
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types 
FROM storage.buckets 
WHERE id = 'recibos';
