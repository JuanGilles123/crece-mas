-- Script para agregar el campo 'enabled_features' a la tabla 'organizations'
-- Este campo permite personalizar las funciones disponibles según el tipo de negocio
-- Ejecutar en Supabase SQL Editor

DO $$ 
BEGIN
  -- Agregar columna enabled_features como array de texto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'enabled_features'
  ) THEN
    ALTER TABLE organizations 
    ADD COLUMN enabled_features text[] DEFAULT ARRAY[]::text[];
    
    -- Migrar datos existentes: si mesas_habilitadas o pedidos_habilitados están activos, agregarlos a enabled_features
    UPDATE organizations
    SET enabled_features = CASE
      WHEN mesas_habilitadas = true AND pedidos_habilitados = true THEN ARRAY['mesas', 'pedidos']
      WHEN mesas_habilitadas = true THEN ARRAY['mesas']
      WHEN pedidos_habilitados = true THEN ARRAY['pedidos']
      ELSE ARRAY[]::text[]
    END
    WHERE enabled_features IS NULL OR array_length(enabled_features, 1) IS NULL;
    
    -- Agregar funciones por defecto según tipo de negocio
    UPDATE organizations
    SET enabled_features = CASE
      WHEN business_type = 'food' THEN ARRAY['toppings', 'mesas', 'pedidos']
      WHEN business_type = 'service' THEN ARRAY['adicionales']
      WHEN business_type = 'clothing' THEN ARRAY['variaciones']
      ELSE enabled_features
    END
    WHERE (enabled_features IS NULL OR array_length(enabled_features, 1) IS NULL)
      AND business_type IS NOT NULL;
    
    -- Crear índice para mejorar consultas
    CREATE INDEX IF NOT EXISTS idx_organizations_enabled_features ON organizations USING GIN (enabled_features);
    
    -- Comentario para documentación
    COMMENT ON COLUMN organizations.enabled_features IS 'Array de funciones habilitadas para el negocio (ej: toppings, mesas, pedidos, adicionales, variaciones)';
    
    RAISE NOTICE 'Columna enabled_features agregada exitosamente a la tabla organizations';
  ELSE
    RAISE NOTICE 'La columna enabled_features ya existe en la tabla organizations';
  END IF;
END $$;
