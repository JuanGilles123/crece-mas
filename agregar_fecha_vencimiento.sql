-- ==========================================
-- AGREGAR FECHA DE VENCIMIENTO A PRODUCTOS
-- Para negocios de comida y productos perecederos
-- ==========================================

-- 1. Agregar columna fecha_vencimiento (opcional, puede ser NULL)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- 2. Agregar índice para búsquedas rápidas por fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_productos_fecha_vencimiento 
ON productos(organization_id, fecha_vencimiento) 
WHERE fecha_vencimiento IS NOT NULL;

-- 3. Crear vista para productos próximos a vencer (dentro de 7 días)
CREATE OR REPLACE VIEW productos_proximos_vencer AS
SELECT 
  p.*,
  (p.fecha_vencimiento - CURRENT_DATE) as dias_restantes
FROM productos p
WHERE 
  p.fecha_vencimiento IS NOT NULL 
  AND p.fecha_vencimiento >= CURRENT_DATE
  AND p.fecha_vencimiento <= (CURRENT_DATE + INTERVAL '7 days')
ORDER BY p.fecha_vencimiento ASC;

-- 4. Crear vista para productos vencidos
CREATE OR REPLACE VIEW productos_vencidos AS
SELECT 
  p.*,
  (CURRENT_DATE - p.fecha_vencimiento) as dias_vencido
FROM productos p
WHERE 
  p.fecha_vencimiento IS NOT NULL 
  AND p.fecha_vencimiento < CURRENT_DATE
ORDER BY p.fecha_vencimiento DESC;

-- 5. Crear función para obtener estadísticas de vencimiento
CREATE OR REPLACE FUNCTION get_vencimiento_stats(org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_con_vencimiento', COUNT(*) FILTER (WHERE fecha_vencimiento IS NOT NULL),
    'proximos_vencer', COUNT(*) FILTER (
      WHERE fecha_vencimiento IS NOT NULL 
      AND fecha_vencimiento >= CURRENT_DATE
      AND fecha_vencimiento <= (CURRENT_DATE + INTERVAL '7 days')
    ),
    'vencidos', COUNT(*) FILTER (
      WHERE fecha_vencimiento IS NOT NULL 
      AND fecha_vencimiento < CURRENT_DATE
    ),
    'vencen_hoy', COUNT(*) FILTER (
      WHERE fecha_vencimiento = CURRENT_DATE
    )
  ) INTO result
  FROM productos
  WHERE organization_id = org_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verificar que todo se creó correctamente
SELECT 'Columna agregada correctamente' as status;
SELECT COUNT(*) as productos_con_vencimiento FROM productos WHERE fecha_vencimiento IS NOT NULL;

-- ==========================================
-- EJEMPLOS DE USO
-- ==========================================

-- Ver productos próximos a vencer de tu organización:
-- SELECT * FROM productos_proximos_vencer WHERE organization_id = 'TU_ORG_ID';

-- Ver productos vencidos:
-- SELECT * FROM productos_vencidos WHERE organization_id = 'TU_ORG_ID';

-- Obtener estadísticas:
-- SELECT get_vencimiento_stats('TU_ORG_ID');

-- Actualizar fecha de vencimiento de un producto:
-- UPDATE productos SET fecha_vencimiento = '2025-12-31' WHERE id = 'PRODUCTO_ID';
