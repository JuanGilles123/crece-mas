-- Script para crear tabla de datos de empresa/facturación

-- Crear tabla de datos de empresa
CREATE TABLE IF NOT EXISTS datos_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nombre_empresa text NOT NULL,
  direccion text NOT NULL,
  telefono text NOT NULL,
  nit text NOT NULL,
  logo_url text,
  email text,
  ciudad text,
  departamento text,
  codigo_postal text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE datos_empresa ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Los usuarios pueden ver sus propios datos de empresa" ON datos_empresa
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios datos de empresa" ON datos_empresa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios datos de empresa" ON datos_empresa
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios datos de empresa" ON datos_empresa
  FOR DELETE USING (auth.uid() = user_id);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_datos_empresa_user_id ON datos_empresa(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_datos_empresa_updated_at 
  BEFORE UPDATE ON datos_empresa 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
