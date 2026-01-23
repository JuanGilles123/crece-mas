-- Script para mejorar la tabla pedidos con tipos y variables adicionales
-- Ejecutar en Supabase SQL Editor

DO $$ 
BEGIN
  -- Agregar tipo de pedido
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'tipo_pedido'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN tipo_pedido VARCHAR(20) DEFAULT 'dine_in' 
      CHECK (tipo_pedido IN ('dine_in', 'takeout', 'delivery', 'express'));
    
    -- Actualizar constraint existente si existe
    ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_tipo_pedido_check;
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_tipo_pedido_check 
      CHECK (tipo_pedido IN ('dine_in', 'takeout', 'delivery', 'express'));
    
    RAISE NOTICE 'Columna tipo_pedido agregada';
  END IF;

  -- Agregar información del cliente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'cliente_nombre'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN cliente_nombre VARCHAR(255);
    RAISE NOTICE 'Columna cliente_nombre agregada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'cliente_telefono'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN cliente_telefono VARCHAR(20);
    RAISE NOTICE 'Columna cliente_telefono agregada';
  END IF;

  -- Agregar información de entrega (para delivery)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'direccion_entrega'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN direccion_entrega TEXT;
    RAISE NOTICE 'Columna direccion_entrega agregada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'costo_envio'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN costo_envio DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Columna costo_envio agregada';
  END IF;

  -- Agregar hora estimada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'hora_estimada'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN hora_estimada TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Columna hora_estimada agregada';
  END IF;

  -- Agregar número de personas (para dine-in)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'numero_personas'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN numero_personas INTEGER DEFAULT 1;
    RAISE NOTICE 'Columna numero_personas agregada';
  END IF;

  -- Agregar prioridad
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'prioridad'
  ) THEN
    ALTER TABLE pedidos 
    ADD COLUMN prioridad VARCHAR(10) DEFAULT 'normal' 
      CHECK (prioridad IN ('normal', 'alta', 'urgente'));
    
    ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_prioridad_check;
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_prioridad_check 
      CHECK (prioridad IN ('normal', 'alta', 'urgente'));
    
    RAISE NOTICE 'Columna prioridad agregada';
  END IF;

  -- Hacer mesa_id opcional (ya debería serlo, pero verificamos)
  -- La columna ya es nullable, así que no necesitamos hacer nada

  -- Crear índices para mejorar consultas
  CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_pedido ON pedidos(organization_id, tipo_pedido);
  CREATE INDEX IF NOT EXISTS idx_pedidos_prioridad ON pedidos(organization_id, prioridad);
  CREATE INDEX IF NOT EXISTS idx_pedidos_hora_estimada ON pedidos(hora_estimada) WHERE hora_estimada IS NOT NULL;

  -- Comentarios para documentación
  COMMENT ON COLUMN pedidos.tipo_pedido IS 'Tipo de pedido: dine_in (comer en local), takeout (para llevar), delivery (domicilio), express (rápido)';
  COMMENT ON COLUMN pedidos.cliente_nombre IS 'Nombre del cliente (opcional, para takeout/delivery)';
  COMMENT ON COLUMN pedidos.cliente_telefono IS 'Teléfono del cliente (opcional, para takeout/delivery)';
  COMMENT ON COLUMN pedidos.direccion_entrega IS 'Dirección de entrega (solo para delivery)';
  COMMENT ON COLUMN pedidos.costo_envio IS 'Costo de envío adicional (solo para delivery)';
  COMMENT ON COLUMN pedidos.hora_estimada IS 'Hora estimada de entrega/recogida';
  COMMENT ON COLUMN pedidos.numero_personas IS 'Número de personas (solo para dine-in)';
  COMMENT ON COLUMN pedidos.prioridad IS 'Prioridad del pedido: normal, alta, urgente';

  RAISE NOTICE 'Tabla pedidos actualizada exitosamente';
END $$;
