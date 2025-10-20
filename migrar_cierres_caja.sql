-- ==========================================
-- MIGRAR TABLA CIERRES_CAJA A NUEVA ESTRUCTURA
-- Agregar campos para desglose de métodos de pago
-- ==========================================

-- Si la tabla ya existe, agregar las nuevas columnas
ALTER TABLE cierres_caja 
ADD COLUMN IF NOT EXISTS sistema_efectivo DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sistema_transferencias DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sistema_tarjeta DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sistema_otros DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_efectivo DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_transferencias DECIMAL(10, 2) DEFAULT 0;

-- Migrar datos existentes (si los hay)
-- Asignar el total_sistema a sistema_efectivo (asumiendo que era todo efectivo)
UPDATE cierres_caja 
SET sistema_efectivo = total_sistema,
    real_efectivo = total_real
WHERE sistema_efectivo = 0 
  AND sistema_transferencias = 0
  AND sistema_tarjeta = 0;

-- Verificar migración
SELECT 
  'Migración completada' as status,
  COUNT(*) as total_registros,
  SUM(sistema_efectivo) as total_efectivo_migrado
FROM cierres_caja;

-- ==========================================
-- NOTA: Ejecuta este script SI YA CREASTE la tabla antes
-- Si la tabla no existe, ejecuta setup_cierres_caja.sql
-- ==========================================
