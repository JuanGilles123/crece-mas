-- Script para verificar pedidos que podrían estar "pegados" o atascados
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. PEDIDOS QUE LLEVAN MUCHO TIEMPO EN UN ESTADO
-- ============================================
-- Identifica pedidos que llevan más de X horas en el mismo estado
-- (ajusta el intervalo según tu necesidad)

SELECT 
  id,
  numero_pedido,
  estado,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 AS horas_sin_cambiar,
  CASE 
    WHEN estado = 'pendiente' AND EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 2 THEN '⚠️ Pendiente más de 2 horas'
    WHEN estado = 'en_preparacion' AND EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 4 THEN '⚠️ En preparación más de 4 horas'
    WHEN estado = 'listo' AND EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 1 THEN '⚠️ Listo más de 1 hora'
    ELSE 'OK'
  END AS alerta,
  mesa_id,
  total,
  organization_id
FROM pedidos
WHERE estado IN ('pendiente', 'en_preparacion', 'listo')
  AND EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 1  -- Más de 1 hora sin cambios
ORDER BY updated_at ASC;

-- ============================================
-- 2. PEDIDOS SIN ITEMS (PEDIDOS HUÉRFANOS)
-- ============================================
-- Identifica pedidos que no tienen items asociados

SELECT 
  p.id,
  p.numero_pedido,
  p.estado,
  p.created_at,
  p.updated_at,
  COUNT(pi.id) AS cantidad_items,
  '⚠️ Pedido sin items' AS problema
FROM pedidos p
LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
WHERE p.estado NOT IN ('completado', 'cancelado')
GROUP BY p.id, p.numero_pedido, p.estado, p.created_at, p.updated_at
HAVING COUNT(pi.id) = 0
ORDER BY p.created_at DESC;

-- ============================================
-- 3. PEDIDOS CON ESTADOS INCONSISTENTES
-- ============================================
-- Identifica pedidos que podrían tener estados inconsistentes
-- (por ejemplo, completado sin fecha de completado)

SELECT 
  id,
  numero_pedido,
  estado,
  completado_at,
  created_at,
  updated_at,
  CASE 
    WHEN estado = 'completado' AND completado_at IS NULL THEN '⚠️ Completado sin fecha'
    WHEN estado = 'completado' AND completado_at IS NOT NULL AND completado_at > NOW() THEN '⚠️ Fecha de completado futura'
    WHEN estado != 'completado' AND completado_at IS NOT NULL THEN '⚠️ Tiene fecha completado pero estado no es completado'
    ELSE 'OK'
  END AS inconsistencia
FROM pedidos
WHERE (estado = 'completado' AND completado_at IS NULL)
   OR (estado != 'completado' AND completado_at IS NOT NULL)
   OR (completado_at IS NOT NULL AND completado_at > NOW())
ORDER BY created_at DESC;

-- ============================================
-- 4. RESUMEN DE PEDIDOS POR ESTADO Y ANTIGÜEDAD
-- ============================================
-- Vista general de todos los pedidos activos agrupados por estado

SELECT 
  estado,
  COUNT(*) AS cantidad,
  MIN(created_at) AS pedido_mas_antiguo,
  MAX(created_at) AS pedido_mas_reciente,
  AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) AS promedio_horas_sin_cambiar,
  MAX(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) AS max_horas_sin_cambiar
FROM pedidos
WHERE estado NOT IN ('completado', 'cancelado')
GROUP BY estado
ORDER BY 
  CASE estado
    WHEN 'pendiente' THEN 1
    WHEN 'en_preparacion' THEN 2
    WHEN 'listo' THEN 3
    ELSE 4
  END;

-- ============================================
-- 5. PEDIDOS RECIENTES VS ANTIGUOS
-- ============================================
-- Identifica si los pedidos "pegados" son nuevos o viejos

SELECT 
  CASE 
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'Nuevo (últimas 24h)'
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Reciente (última semana)'
    WHEN created_at > NOW() - INTERVAL '30 days' THEN 'Antiguo (último mes)'
    ELSE 'Muy antiguo (más de 1 mes)'
  END AS antiguedad,
  estado,
  COUNT(*) AS cantidad,
  AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600) AS promedio_horas_sin_cambiar
FROM pedidos
WHERE estado NOT IN ('completado', 'cancelado')
GROUP BY 
  CASE 
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'Nuevo (últimas 24h)'
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Reciente (última semana)'
    WHEN created_at > NOW() - INTERVAL '30 days' THEN 'Antiguo (último mes)'
    ELSE 'Muy antiguo (más de 1 mes)'
  END,
  estado
ORDER BY 
  CASE 
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 2
    WHEN created_at > NOW() - INTERVAL '30 days' THEN 3
    ELSE 4
  END,
  estado;

-- ============================================
-- 6. PEDIDOS CON MESA OCUPADA PERO PEDIDO COMPLETADO
-- ============================================
-- Verifica si hay mesas que deberían estar disponibles

SELECT 
  p.id AS pedido_id,
  p.numero_pedido,
  p.estado AS estado_pedido,
  p.mesa_id,
  m.numero AS numero_mesa,
  m.estado AS estado_mesa,
  CASE 
    WHEN p.estado = 'completado' AND m.estado = 'ocupada' THEN '⚠️ Mesa ocupada pero pedido completado'
    WHEN p.estado IN ('pendiente', 'en_preparacion', 'listo') AND m.estado != 'ocupada' THEN '⚠️ Pedido activo pero mesa no ocupada'
    ELSE 'OK'
  END AS inconsistencia
FROM pedidos p
INNER JOIN mesas m ON p.mesa_id = m.id
WHERE (p.estado = 'completado' AND m.estado = 'ocupada')
   OR (p.estado IN ('pendiente', 'en_preparacion', 'listo') AND m.estado != 'ocupada')
ORDER BY p.created_at DESC;
