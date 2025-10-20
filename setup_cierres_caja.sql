-- ==========================================
-- TABLA PARA CIERRE DE CAJA
-- Registra el cierre diario comparando sistema vs efectivo real
-- ==========================================

-- 1. Crear tabla de cierres de caja
CREATE TABLE IF NOT EXISTS cierres_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  -- Totales del sistema (por método de pago)
  sistema_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sistema_transferencias DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sistema_tarjeta DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sistema_otros DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_sistema DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Totales reales contados
  real_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  real_transferencias DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_real DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Diferencia
  diferencia DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cantidad_ventas INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cierres_caja_organization 
ON cierres_caja(organization_id);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_fecha 
ON cierres_caja(organization_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_user 
ON cierres_caja(user_id);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_cierres_caja_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cierres_caja_updated_at
BEFORE UPDATE ON cierres_caja
FOR EACH ROW
EXECUTE FUNCTION update_cierres_caja_updated_at();

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE cierres_caja ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para cierres_caja

-- Permitir SELECT a usuarios de la misma organización
CREATE POLICY "Usuarios pueden ver cierres de su organización"
ON cierres_caja FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Permitir INSERT a usuarios autenticados de la organización
CREATE POLICY "Usuarios pueden crear cierres de su organización"
ON cierres_caja FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Permitir UPDATE solo al usuario que creó el cierre (mismo día)
CREATE POLICY "Usuarios pueden actualizar sus propios cierres del día"
ON cierres_caja FOR UPDATE
USING (
  user_id = auth.uid() AND 
  fecha = CURRENT_DATE
)
WITH CHECK (
  user_id = auth.uid() AND 
  fecha = CURRENT_DATE
);

-- 6. Crear vista para estadísticas de cierres
CREATE OR REPLACE VIEW estadisticas_cierres AS
SELECT 
  organization_id,
  COUNT(*) as total_cierres,
  SUM(diferencia) as diferencia_acumulada,
  AVG(diferencia) as diferencia_promedio,
  MAX(fecha) as ultimo_cierre,
  COUNT(CASE WHEN diferencia > 0 THEN 1 END) as cierres_con_sobrante,
  COUNT(CASE WHEN diferencia < 0 THEN 1 END) as cierres_con_faltante,
  COUNT(CASE WHEN diferencia = 0 THEN 1 END) as cierres_exactos
FROM cierres_caja
GROUP BY organization_id;

-- 7. Función para obtener cierres del mes
CREATE OR REPLACE FUNCTION get_cierres_mes(org_id UUID, mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TABLE (
  fecha DATE,
  total_sistema DECIMAL,
  total_real DECIMAL,
  diferencia DECIMAL,
  cantidad_ventas INTEGER,
  user_nombre TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.fecha,
    c.total_sistema,
    c.total_real,
    c.diferencia,
    c.cantidad_ventas,
    COALESCE(up.nombre, u.email) as user_nombre
  FROM cierres_caja c
  LEFT JOIN auth.users u ON c.user_id = u.id
  LEFT JOIN user_profiles up ON c.user_id = up.user_id
  WHERE 
    c.organization_id = org_id
    AND EXTRACT(MONTH FROM c.fecha) = mes
    AND EXTRACT(YEAR FROM c.fecha) = anio
  ORDER BY c.fecha DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar que todo se creó correctamente
SELECT 'Tabla cierres_caja creada correctamente' as status;
SELECT COUNT(*) as cierres_registrados FROM cierres_caja;

-- ==========================================
-- EJEMPLOS DE USO
-- ==========================================

-- Ver todos los cierres de tu organización:
-- SELECT * FROM cierres_caja WHERE organization_id = 'TU_ORG_ID' ORDER BY fecha DESC;

-- Ver cierres del mes actual:
-- SELECT * FROM get_cierres_mes('TU_ORG_ID');

-- Ver estadísticas de cierres:
-- SELECT * FROM estadisticas_cierres WHERE organization_id = 'TU_ORG_ID';

-- Insertar un cierre de caja:
-- INSERT INTO cierres_caja (organization_id, user_id, fecha, total_sistema, total_real, diferencia, cantidad_ventas)
-- VALUES ('ORG_ID', 'USER_ID', CURRENT_DATE, 1500000, 1480000, -20000, 25);
