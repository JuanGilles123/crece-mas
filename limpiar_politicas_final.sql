-- LIMPIAR POLÍTICAS DUPLICADAS Y CONFLICTIVAS - VERSIÓN FINAL
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE datos_empresa
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios datos de empresa" ON datos_empresa;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios datos de empresa" ON datos_empresa;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios datos de empresa" ON datos_empresa;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios datos de empresa" ON datos_empresa;
DROP POLICY IF EXISTS "Users can view own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can insert own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can update own company data" ON datos_empresa;
DROP POLICY IF EXISTS "Users can delete own company data" ON datos_empresa;

-- 2. ELIMINAR TODAS LAS POLÍTICAS DE STORAGE
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

-- 3. CREAR SOLO LAS POLÍTICAS CORRECTAS PARA datos_empresa
CREATE POLICY "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);

-- 4. CREAR SOLO LAS POLÍTICAS CORRECTAS PARA STORAGE

-- Políticas para LOGOS
CREATE POLICY "Users can upload logos to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own logos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Logos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- Políticas para RECIBOS
CREATE POLICY "Users can upload receipts to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own receipts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recibos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
