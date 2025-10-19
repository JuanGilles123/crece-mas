-- ============================================
-- AGREGAR INFORMACIÓN DE FACTURACIÓN A ORGANIZATIONS
-- ============================================
-- Cada organización tendrá su propia info de facturación
-- ============================================

-- PASO 1: Agregar columnas de facturación a organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS nit TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS regimen_tributario TEXT; -- Común, Simplificado, etc.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS responsable_iva BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT; -- URL del logo para facturas
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS mensaje_factura TEXT; -- Mensaje personalizado en facturas

-- PASO 2: Agregar índices
CREATE INDEX IF NOT EXISTS idx_organizations_nit ON organizations(nit);

-- PASO 3: Verificar columnas agregadas
SELECT 
  '✅ COLUMNAS DE FACTURACIÓN' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN (
    'razon_social', 'nit', 'direccion', 'telefono', 
    'email', 'ciudad', 'regimen_tributario', 
    'responsable_iva', 'logo_url', 'mensaje_factura'
  )
ORDER BY ordinal_position;

-- PASO 4: Migrar datos existentes desde user_profiles (si existen)
-- Copiar info de facturación del owner al organization
UPDATE organizations o
SET 
  razon_social = COALESCE(o.razon_social, up.full_name),
  telefono = COALESCE(o.telefono, up.phone),
  email = COALESCE(o.email, (SELECT email FROM auth.users WHERE id = up.user_id))
FROM user_profiles up
WHERE o.owner_id = up.user_id
  AND (o.razon_social IS NULL OR o.telefono IS NULL OR o.email IS NULL);

-- PASO 5: Ver estado actual de organizaciones
SELECT 
  '📊 TUS ORGANIZACIONES' as info,
  o.id,
  o.name as nombre_negocio,
  o.razon_social,
  o.nit,
  o.email,
  o.telefono,
  tm.role as tu_rol
FROM organizations o
INNER JOIN team_members tm ON tm.organization_id = o.id
WHERE tm.user_id = auth.uid()
ORDER BY tm.created_at;

-- PASO 6: Actualizar RLS policies para organizations
-- Permitir a miembros del equipo VER la info de facturación
DROP POLICY IF EXISTS "team_members_view_organization" ON organizations;
CREATE POLICY "team_members_view_organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Permitir solo a OWNERS actualizar la info de facturación
DROP POLICY IF EXISTS "owners_update_organization" ON organizations;
CREATE POLICY "owners_update_organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner' 
        AND status = 'active'
    )
  );

-- PASO 7: Crear vista para info de facturación (más fácil de consultar)
CREATE OR REPLACE VIEW organization_billing_info AS
SELECT 
  o.id as organization_id,
  o.name as nombre_negocio,
  o.razon_social,
  o.nit,
  o.direccion,
  o.telefono,
  o.email,
  o.ciudad,
  o.regimen_tributario,
  o.responsable_iva,
  o.logo_url,
  o.mensaje_factura,
  o.created_at
FROM organizations o;

-- Dar permisos a la vista
GRANT SELECT ON organization_billing_info TO authenticated;

-- PASO 8: Verificar políticas
SELECT 
  '📋 POLÍTICAS ORGANIZATIONS' as info,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'organizations'
ORDER BY cmd;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
DECLARE
  total_orgs INTEGER;
  orgs_con_info INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orgs FROM organizations;
  SELECT COUNT(*) INTO orgs_con_info 
  FROM organizations 
  WHERE razon_social IS NOT NULL AND email IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ FACTURACIÓN POR ORGANIZACIÓN CONFIGURADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total organizaciones: %', total_orgs;
  RAISE NOTICE 'Con info de facturación: %', orgs_con_info;
  RAISE NOTICE '';
  RAISE NOTICE '📝 CAMPOS DISPONIBLES:';
  RAISE NOTICE '  - razón_social (nombre legal)';
  RAISE NOTICE '  - nit (identificación tributaria)';
  RAISE NOTICE '  - dirección';
  RAISE NOTICE '  - teléfono';
  RAISE NOTICE '  - email';
  RAISE NOTICE '  - ciudad';
  RAISE NOTICE '  - régimen_tributario';
  RAISE NOTICE '  - responsable_iva';
  RAISE NOTICE '  - logo_url (para facturas)';
  RAISE NOTICE '  - mensaje_factura';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SIGUIENTE PASO:';
  RAISE NOTICE '1. Actualizar componente de Perfil/Configuración';
  RAISE NOTICE '2. Agregar formulario para editar info de facturación';
  RAISE NOTICE '3. Usar esta info en recibos/facturas';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
