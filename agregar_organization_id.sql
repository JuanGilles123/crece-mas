-- ============================================
-- AGREGAR COLUMNA organization_id A TABLAS
-- ============================================
-- ⚠️ EJECUTA ESTO EN SUPABASE SQL EDITOR ⚠️
-- ============================================

-- PASO 1: Agregar columna organization_id a productos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE productos ADD COLUMN organization_id UUID;
    RAISE NOTICE '✅ Columna organization_id agregada a productos';
  ELSE
    RAISE NOTICE '⚠️ Columna organization_id ya existe en productos';
  END IF;
END $$;

-- PASO 2: Agregar columna organization_id a ventas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE ventas ADD COLUMN organization_id UUID;
    RAISE NOTICE '✅ Columna organization_id agregada a ventas';
  ELSE
    RAISE NOTICE '⚠️ Columna organization_id ya existe en ventas';
  END IF;
END $$;

-- PASO 3: Migrar datos existentes (copiar del perfil del usuario)
-- Productos: Asignar organization_id basado en el user_id
UPDATE productos p
SET organization_id = (
  SELECT up.organization_id 
  FROM user_profiles up 
  WHERE up.user_id = p.user_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- PASO 4: Migrar datos de ventas
UPDATE ventas v
SET organization_id = (
  SELECT up.organization_id 
  FROM user_profiles up 
  WHERE up.user_id = v.user_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- PASO 5: Hacer columnas NOT NULL después de migrar
ALTER TABLE productos ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE ventas ALTER COLUMN organization_id SET NOT NULL;

-- PASO 6: Agregar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_organization_id ON productos(organization_id);
CREATE INDEX IF NOT EXISTS idx_ventas_organization_id ON ventas(organization_id);

-- PASO 7: Agregar Foreign Keys
ALTER TABLE productos 
ADD CONSTRAINT fk_productos_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE ventas 
ADD CONSTRAINT fk_ventas_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- PASO 8: Actualizar RLS policies para productos
DROP POLICY IF EXISTS "Users can view their own products" ON productos;
DROP POLICY IF EXISTS "Users can insert their own products" ON productos;
DROP POLICY IF EXISTS "Users can update their own products" ON productos;
DROP POLICY IF EXISTS "Users can delete their own products" ON productos;

-- Nueva política: Ver productos de organizaciones a las que perteneces
CREATE POLICY "team_members_view_productos" ON productos
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Insertar productos en tus organizaciones
CREATE POLICY "team_members_insert_productos" ON productos
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Actualizar productos de tus organizaciones
CREATE POLICY "team_members_update_productos" ON productos
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Eliminar productos de tus organizaciones
CREATE POLICY "team_members_delete_productos" ON productos
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- PASO 9: Actualizar RLS policies para ventas
DROP POLICY IF EXISTS "Users can view their own sales" ON ventas;
DROP POLICY IF EXISTS "Users can insert their own sales" ON ventas;
DROP POLICY IF EXISTS "Users can update their own sales" ON ventas;
DROP POLICY IF EXISTS "Users can delete their own sales" ON ventas;

-- Nueva política: Ver ventas de organizaciones a las que perteneces
CREATE POLICY "team_members_view_ventas" ON ventas
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Insertar ventas en tus organizaciones
CREATE POLICY "team_members_insert_ventas" ON ventas
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Actualizar ventas de tus organizaciones
CREATE POLICY "team_members_update_ventas" ON ventas
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Nueva política: Eliminar ventas de tus organizaciones
CREATE POLICY "team_members_delete_ventas" ON ventas
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 
  '✅ MIGRACIÓN COMPLETADA' as status,
  (SELECT COUNT(*) FROM productos WHERE organization_id IS NOT NULL) as productos_migrados,
  (SELECT COUNT(*) FROM ventas WHERE organization_id IS NOT NULL) as ventas_migradas;

SELECT 
  '📋 POLÍTICAS PRODUCTOS' as tabla,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'productos'
ORDER BY cmd;

SELECT 
  '📋 POLÍTICAS VENTAS' as tabla,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'ventas'
ORDER BY cmd;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Columnas organization_id agregadas';
  RAISE NOTICE '✅ Datos existentes migrados';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '✅ Foreign keys agregadas';
  RAISE NOTICE '✅ RLS policies actualizadas';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AHORA PUEDES:';
  RAISE NOTICE '1. Recargar tu aplicación (F5)';
  RAISE NOTICE '2. Los datos aparecerán correctamente';
  RAISE NOTICE '3. Cambiar entre organizaciones';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
