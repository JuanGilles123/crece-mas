-- Script rápido para crear solo la tabla datos_empresa
-- Ejecutar en Supabase SQL Editor

-- Crear tabla datos_empresa
CREATE TABLE IF NOT EXISTS datos_empresa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_empresa TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT NOT NULL,
    nit TEXT NOT NULL,
    logo_url TEXT,
    email TEXT,
    ciudad TEXT,
    departamento TEXT,
    codigo_postal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own company data" ON datos_empresa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company data" ON datos_empresa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company data" ON datos_empresa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company data" ON datos_empresa
    FOR DELETE USING (auth.uid() = user_id);
