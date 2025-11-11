-- ============================================
-- FIX: Errores 404 en productos y ventas
-- Verifica y corrige las políticas RLS
-- IMPORTANTE: Las tablas se llaman "productos" y "ventas" (en español)
-- ============================================

-- 1️⃣ Verificar si las tablas existen
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN ('productos', 'ventas')
AND schemaname = 'public';

-- 2️⃣ Verificar políticas RLS existentes en productos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'productos'
ORDER BY policyname;

-- 3️⃣ Verificar políticas RLS existentes en ventas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'ventas'
ORDER BY policyname;

-- 4️⃣ Habilitar RLS si no está habilitado
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Crear política de SELECT para productos
DROP POLICY IF EXISTS "Users can view their organization productos" ON productos;

CREATE POLICY "Users can view their organization productos"
ON productos FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 6️⃣ Crear política de SELECT para ventas
DROP POLICY IF EXISTS "Users can view their organization ventas" ON ventas;

CREATE POLICY "Users can view their organization ventas"
ON ventas FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 7️⃣ Crear políticas de INSERT para productos
DROP POLICY IF EXISTS "Users can insert productos in their organization" ON productos;

CREATE POLICY "Users can insert productos in their organization"
ON productos FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 8️⃣ Crear políticas de INSERT para ventas
DROP POLICY IF EXISTS "Users can insert ventas in their organization" ON ventas;

CREATE POLICY "Users can insert ventas in their organization"
ON ventas FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 9️⃣ Crear políticas de UPDATE para productos
DROP POLICY IF EXISTS "Users can update productos in their organization" ON productos;

CREATE POLICY "Users can update productos in their organization"
ON productos FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 🔟 Crear políticas de UPDATE para ventas
DROP POLICY IF EXISTS "Users can update ventas in their organization" ON ventas;

CREATE POLICY "Users can update ventas in their organization"
ON ventas FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 1️⃣1️⃣ Crear políticas de DELETE para productos
DROP POLICY IF EXISTS "Users can delete productos in their organization" ON productos;

CREATE POLICY "Users can delete productos in their organization"
ON productos FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 1️⃣2️⃣ Crear políticas de DELETE para ventas
DROP POLICY IF EXISTS "Users can delete ventas in their organization" ON ventas;

CREATE POLICY "Users can delete ventas in their organization"
ON ventas FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- ✅ Verificar que las políticas se crearon correctamente
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('productos', 'ventas')
ORDER BY tablename, cmd, policyname;
