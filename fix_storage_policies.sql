-- ARREGLAR POLÍTICAS DE STORAGE
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE STORAGE EXISTENTES
DROP POLICY IF EXISTS "Los usuarios pueden subir sus propios recibos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios recibos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios recibos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios recibos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden subir sus propios logos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios logos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios logos" ON storage.objects;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios logos" ON storage.objects;
DROP POLICY IF EXISTS "Los logos son públicos para visualización" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload logos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload receipts to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

-- 2. CREAR POLÍTICAS SIMPLES Y FUNCIONALES

-- Política para subir logos (más permisiva)
CREATE POLICY "Allow logo uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'logos');

-- Política para ver logos (públicos)
CREATE POLICY "Allow logo viewing" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- Política para subir recibos (más permisiva)
CREATE POLICY "Allow receipt uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'recibos');

-- Política para ver recibos (más permisiva)
CREATE POLICY "Allow receipt viewing" ON storage.objects
    FOR SELECT USING (bucket_id = 'recibos');
