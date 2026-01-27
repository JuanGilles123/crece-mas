-- Agregar campo precio_unitario_recibido a orden_compra_items
-- Este campo almacena el precio unitario real recibido, que puede diferir del precio ordenado

ALTER TABLE orden_compra_items 
ADD COLUMN IF NOT EXISTS precio_unitario_recibido DECIMAL(10, 2);

-- Comentario para documentar el campo
COMMENT ON COLUMN orden_compra_items.precio_unitario_recibido IS 'Precio unitario real recibido, puede diferir del precio_unitario ordenado';
