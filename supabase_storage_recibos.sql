-- Script para configurar el bucket de almacenamiento para recibos PDF

-- Crear bucket para recibos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recibos',
  'recibos',
  false,
  10485760, -- 10MB límite
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Crear política para que los usuarios puedan subir sus propios recibos
CREATE POLICY "Los usuarios pueden subir sus propios recibos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'recibos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan ver sus propios recibos
CREATE POLICY "Los usuarios pueden ver sus propios recibos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'recibos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan actualizar sus propios recibos
CREATE POLICY "Los usuarios pueden actualizar sus propios recibos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'recibos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan eliminar sus propios recibos
CREATE POLICY "Los usuarios pueden eliminar sus propios recibos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'recibos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
