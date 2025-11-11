-- ============================================
-- FIX: Errores 404 en productos y ventas
-- Verifica y corrige las políticas RLS
-- ============================================

-- 1️⃣ Verificar si las tablas existen
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN ('products', 'sales')
AND schemaname = 'public';

-- 2️⃣ Verificar políticas RLS existentes en products
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- 3️⃣ Verificar políticas RLS existentes en sales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sales'
ORDER BY policyname;

-- 4️⃣ Habilitar RLS si no está habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Crear política de SELECT para products (si no existe)
-- Permite ver productos de la organización del usuario
DROP POLICY IF EXISTS "Users can view their organization products" ON products;

CREATE POLICY "Users can view their organization products"
ON products FOR SELECT
TO authenticated
USING (
  organization_id IN (
    -- Organizaciones donde el usuario es miembro
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    -- Organizaciones donde el usuario es owner
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 6️⃣ Crear política de SELECT para sales (si no existe)
-- Permite ver ventas de la organización del usuario
DROP POLICY IF EXISTS "Users can view their organization sales" ON sales;

CREATE POLICY "Users can view their organization sales"
ON sales FOR SELECT
TO authenticated
USING (
  organization_id IN (
    -- Organizaciones donde el usuario es miembro
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    -- Organizaciones donde el usuario es owner
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 7️⃣ Crear políticas de INSERT para products
DROP POLICY IF EXISTS "Users can insert products in their organization" ON products;

CREATE POLICY "Users can insert products in their organization"
ON products FOR INSERT
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

-- 8️⃣ Crear políticas de INSERT para sales
DROP POLICY IF EXISTS "Users can insert sales in their organization" ON sales;

CREATE POLICY "Users can insert sales in their organization"
ON sales FOR INSERT
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

-- 9️⃣ Crear políticas de UPDATE para products
DROP POLICY IF EXISTS "Users can update products in their organization" ON products;

CREATE POLICY "Users can update products in their organization"
ON products FOR UPDATE
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

-- 🔟 Crear políticas de UPDATE para sales
DROP POLICY IF EXISTS "Users can update sales in their organization" ON sales;

CREATE POLICY "Users can update sales in their organization"
ON sales FOR UPDATE
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

-- 1️⃣1️⃣ Crear políticas de DELETE para products
DROP POLICY IF EXISTS "Users can delete products in their organization" ON products;

CREATE POLICY "Users can delete products in their organization"
ON products FOR DELETE
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

-- 1️⃣2️⃣ Crear políticas de DELETE para sales
DROP POLICY IF EXISTS "Users can delete sales in their organization" ON sales;

CREATE POLICY "Users can delete sales in their organization"
ON sales FOR DELETE
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
WHERE tablename IN ('products', 'sales')
ORDER BY tablename, cmd, policyname;
