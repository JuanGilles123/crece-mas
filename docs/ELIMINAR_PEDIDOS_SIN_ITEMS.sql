-- Script para identificar y eliminar pedidos sin items
-- Ejecutar en Supabase SQL Editor
-- IMPORTANTE: Revisa los resultados antes de ejecutar la eliminación

-- ============================================
-- PASO 1: IDENTIFICAR PEDIDOS SIN ITEMS
-- ============================================
-- Ejecuta esta consulta primero para ver qué pedidos se eliminarán
SELECT 
  p.id,
  p.numero_pedido,
  p.estado,
  p.created_at,
  p.organization_id,
  COUNT(pi.id) as cantidad_items
FROM pedidos p
LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
GROUP BY p.id, p.numero_pedido, p.estado, p.created_at, p.organization_id
HAVING COUNT(pi.id) = 0
ORDER BY p.created_at DESC;

-- ============================================
-- PASO 2: VERIFICAR PEDIDOS ANTIGUOS SIN ITEMS
-- ============================================
-- Opcional: Ver solo pedidos más antiguos que una fecha específica
-- Ajusta la fecha según tus necesidades
SELECT 
  p.id,
  p.numero_pedido,
  p.estado,
  p.created_at,
  p.organization_id,
  COUNT(pi.id) as cantidad_items
FROM pedidos p
LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
WHERE p.created_at < NOW() - INTERVAL '30 days'  -- Cambia '30 days' según necesites
GROUP BY p.id, p.numero_pedido, p.estado, p.created_at, p.organization_id
HAVING COUNT(pi.id) = 0
ORDER BY p.created_at DESC;

-- ============================================
-- PASO 3: ELIMINAR PEDIDOS SIN ITEMS
-- ============================================
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
-- Ejecuta solo después de verificar los resultados del PASO 1

DO $$
DECLARE
  pedidos_eliminados INTEGER := 0;
  pedido_record RECORD;
BEGIN
  -- Eliminar pedidos que no tienen items asociados
  FOR pedido_record IN 
    SELECT p.id
    FROM pedidos p
    LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    GROUP BY p.id
    HAVING COUNT(pi.id) = 0
  LOOP
    -- Eliminar el pedido (los items ya no existen, pero por si acaso)
    DELETE FROM pedidos WHERE id = pedido_record.id;
    pedidos_eliminados := pedidos_eliminados + 1;
  END LOOP;
  
  RAISE NOTICE 'Se eliminaron % pedido(s) sin items', pedidos_eliminados;
END $$;

-- ============================================
-- PASO 4: ELIMINAR SOLO PEDIDOS ANTIGUOS SIN ITEMS
-- ============================================
-- Versión más segura: Solo elimina pedidos antiguos (más de 30 días)
-- Ajusta la fecha según tus necesidades

DO $$
DECLARE
  pedidos_eliminados INTEGER := 0;
  pedido_record RECORD;
  fecha_limite TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Definir fecha límite (pedidos más antiguos que esta fecha)
  fecha_limite := NOW() - INTERVAL '30 days';  -- Cambia '30 days' según necesites
  
  -- Eliminar pedidos antiguos que no tienen items asociados
  FOR pedido_record IN 
    SELECT p.id, p.numero_pedido, p.created_at
    FROM pedidos p
    LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    WHERE p.created_at < fecha_limite
    GROUP BY p.id, p.numero_pedido, p.created_at
    HAVING COUNT(pi.id) = 0
  LOOP
    -- Eliminar el pedido
    DELETE FROM pedidos WHERE id = pedido_record.id;
    pedidos_eliminados := pedidos_eliminados + 1;
    
    RAISE NOTICE 'Eliminado pedido: % (creado el %)', pedido_record.numero_pedido, pedido_record.created_at;
  END LOOP;
  
  RAISE NOTICE 'Total de pedidos eliminados: %', pedidos_eliminados;
END $$;

-- ============================================
-- PASO 5: VERIFICACIÓN POST-ELIMINACIÓN
-- ============================================
-- Ejecuta esto después de eliminar para verificar que no quedan pedidos sin items
SELECT 
  COUNT(*) as pedidos_sin_items_restantes
FROM pedidos p
LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
GROUP BY p.id
HAVING COUNT(pi.id) = 0;

-- Si el resultado es 0, significa que todos los pedidos sin items fueron eliminados correctamente
