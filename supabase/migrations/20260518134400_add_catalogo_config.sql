-- Agregar columna catalogo_config a organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS catalogo_config JSONB DEFAULT '{}'::jsonb;

-- Recrear vista public_organizations para exponer catalogo_config y logo_url
CREATE OR REPLACE VIEW public_organizations AS
SELECT id, name, slug, logo_url, business_type, catalogo_config
FROM organizations;

GRANT SELECT ON public_organizations TO anon;
GRANT SELECT ON public_organizations TO authenticated;

-- Recrear vista public_productos para filtrar los productos marcados como ocultos en catalogo
CREATE OR REPLACE VIEW public_productos AS
SELECT 
  id, 
  organization_id, 
  nombre, 
  codigo, 
  precio_venta, 
  stock as stock_disponible, 
  imagen as url_imagen, 
  metadata
FROM productos
WHERE (metadata->>'ocultar_en_catalogo' IS NULL OR (metadata->>'ocultar_en_catalogo')::text != 'true');

GRANT SELECT ON public_productos TO anon;
GRANT SELECT ON public_productos TO authenticated;
