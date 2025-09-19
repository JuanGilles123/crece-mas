-- Script para configurar el bucket de almacenamiento para logos de empresa

-- Crear bucket para logos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Público para que se puedan mostrar en los recibos
  2097152, -- 2MB límite
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Crear política para que los usuarios puedan subir sus propios logos
CREATE POLICY "Los usuarios pueden subir sus propios logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan ver sus propios logos
CREATE POLICY "Los usuarios pueden ver sus propios logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan actualizar sus propios logos
CREATE POLICY "Los usuarios pueden actualizar sus propios logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear política para que los usuarios puedan eliminar sus propios logos
CREATE POLICY "Los usuarios pueden eliminar sus propios logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que los logos sean públicos (para mostrar en recibos)
CREATE POLICY "Los logos son públicos para visualización" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');
