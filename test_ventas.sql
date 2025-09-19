-- Script de prueba para verificar la funcionalidad de ventas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que podemos insertar una venta de prueba
-- (Reemplaza 'TU_USER_ID_AQUI' con tu ID de usuario real)
INSERT INTO ventas (
    user_id,
    total,
    metodo_pago,
    items,
    fecha,
    pago_cliente
) VALUES (
    'TU_USER_ID_AQUI', -- Reemplaza con tu user_id
    10000,
    'Efectivo',
    '[{"id": 1, "nombre": "Producto Test", "precio_venta": 5000, "qty": 2}]',
    NOW(),
    10000
);

-- 2. Verificar que la venta se insertó correctamente
SELECT * FROM ventas ORDER BY created_at DESC LIMIT 1;

-- 3. Verificar que podemos actualizar el stock de un producto
-- (Reemplaza 'TU_USER_ID_AQUI' con tu ID de usuario real)
UPDATE productos 
SET stock = stock - 1 
WHERE user_id = 'TU_USER_ID_AQUI' 
AND id = 1; -- Reemplaza con un ID de producto real

-- 4. Verificar que el stock se actualizó
SELECT id, nombre, stock FROM productos 
WHERE user_id = 'TU_USER_ID_AQUI' 
ORDER BY created_at DESC LIMIT 5;

-- 5. Limpiar datos de prueba (opcional)
-- DELETE FROM ventas WHERE total = 10000 AND metodo_pago = 'Efectivo';
