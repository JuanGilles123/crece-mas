-- ============================================
-- Script para agregar soporte de empleados sin login
-- ============================================
-- Este script agrega las columnas necesarias a la tabla team_members
-- para permitir crear empleados sin requerir un usuario autenticado

-- 1. Hacer user_id nullable (para empleados sin login)
ALTER TABLE team_members 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar columna para código único del empleado
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE;

-- 3. Agregar columna para nombre del empleado
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- 4. Agregar columna para email del empleado (opcional)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_email TEXT;

-- 5. Agregar columna para teléfono del empleado (opcional)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_phone TEXT;

-- 6. Agregar columna para marcar si es empleado sin login
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT FALSE;

-- 7. Crear índice para búsqueda rápida por código de empleado
CREATE INDEX IF NOT EXISTS idx_team_members_employee_code 
ON team_members(employee_code) 
WHERE employee_code IS NOT NULL;

-- 8. Crear índice para filtrar empleados
CREATE INDEX IF NOT EXISTS idx_team_members_is_employee 
ON team_members(is_employee) 
WHERE is_employee = TRUE;

-- 9. Agregar constraint para asegurar que si es empleado, tenga código
ALTER TABLE team_members 
ADD CONSTRAINT check_employee_code 
CHECK (
  (is_employee = FALSE) OR 
  (is_employee = TRUE AND employee_code IS NOT NULL AND employee_name IS NOT NULL)
);

-- 10. Nota: Los empleados pueden tener user_id después de hacer login por primera vez
-- No agregamos constraint aquí porque user_id puede ser NULL inicialmente y luego poblarse
-- El sistema permite que los empleados tengan user_id después de autenticarse

-- 11. Comentarios en las columnas
COMMENT ON COLUMN team_members.employee_code IS 'Código único para empleados. Puede ser código corto (5 dígitos numéricos) o teléfono|PIN (formato: telefono|PIN). Se usa para autenticación.';
COMMENT ON COLUMN team_members.employee_name IS 'Nombre completo del empleado';
COMMENT ON COLUMN team_members.employee_email IS 'Email del empleado (opcional)';
COMMENT ON COLUMN team_members.employee_phone IS 'Teléfono del empleado (opcional, necesario si se usa teléfono|PIN como código)';
COMMENT ON COLUMN team_members.is_employee IS 'Indica si este registro es un empleado. user_id puede ser NULL inicialmente y poblarse después del primer login.';

-- ============================================
-- Verificación
-- ============================================
-- Ejecutar para verificar que las columnas se crearon correctamente:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'team_members' 
-- AND column_name IN ('employee_code', 'employee_name', 'employee_email', 'employee_phone', 'is_employee');
