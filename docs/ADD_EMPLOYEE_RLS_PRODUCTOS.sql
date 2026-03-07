-- ============================================================
-- POLÍTICAS RLS PARA EMPLEADOS — Script final corregido
-- ============================================================
-- Tablas reales verificadas en el código fuente.
-- Los empleados usan el rol 'anon' (llave anónima de Supabase).
--
-- EJECUTAR completo en Supabase SQL Editor
-- ============================================================

-- ==================== PRODUCTOS ====================
DROP POLICY IF EXISTS "Anon can view productos by organization" ON productos;
CREATE POLICY "Anon can view productos by organization"
  ON productos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can update productos" ON productos;
CREATE POLICY "Anon can update productos"
  ON productos FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ==================== PRODUCT_VARIANTS ====================
DROP POLICY IF EXISTS "Anon can view product_variants" ON product_variants;
CREATE POLICY "Anon can view product_variants"
  ON product_variants FOR SELECT TO anon USING (true);

-- ==================== VENTAS (incluye cotizaciones) ====================
DROP POLICY IF EXISTS "Anon can view ventas" ON ventas;
CREATE POLICY "Anon can view ventas"
  ON ventas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert ventas" ON ventas;
CREATE POLICY "Anon can insert ventas"
  ON ventas FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update ventas" ON ventas;
CREATE POLICY "Anon can update ventas"
  ON ventas FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete ventas" ON ventas;
CREATE POLICY "Anon can delete ventas"
  ON ventas FOR DELETE TO anon USING (true);

-- ==================== CLIENTES ====================
DROP POLICY IF EXISTS "Anon can view clientes" ON clientes;
CREATE POLICY "Anon can view clientes"
  ON clientes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert clientes" ON clientes;
CREATE POLICY "Anon can insert clientes"
  ON clientes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update clientes" ON clientes;
CREATE POLICY "Anon can update clientes"
  ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ==================== TOPPINGS ====================
DROP POLICY IF EXISTS "Anon can view toppings" ON toppings;
CREATE POLICY "Anon can view toppings"
  ON toppings FOR SELECT TO anon USING (true);

-- ==================== VARIACIONES ====================
DROP POLICY IF EXISTS "Anon can view variaciones" ON variaciones;
CREATE POLICY "Anon can view variaciones"
  ON variaciones FOR SELECT TO anon USING (true);

-- ==================== CREDITOS ====================
DROP POLICY IF EXISTS "Anon can view creditos" ON creditos;
CREATE POLICY "Anon can view creditos"
  ON creditos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert creditos" ON creditos;
CREATE POLICY "Anon can insert creditos"
  ON creditos FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update creditos" ON creditos;
CREATE POLICY "Anon can update creditos"
  ON creditos FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ==================== PAGOS_CREDITOS ====================
DROP POLICY IF EXISTS "Anon can view pagos_creditos" ON pagos_creditos;
CREATE POLICY "Anon can view pagos_creditos"
  ON pagos_creditos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert pagos_creditos" ON pagos_creditos;
CREATE POLICY "Anon can insert pagos_creditos"
  ON pagos_creditos FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete pagos_creditos" ON pagos_creditos;
CREATE POLICY "Anon can delete pagos_creditos"
  ON pagos_creditos FOR DELETE TO anon USING (true);

-- ==================== PEDIDOS ====================
DROP POLICY IF EXISTS "Anon can view pedidos" ON pedidos;
CREATE POLICY "Anon can view pedidos"
  ON pedidos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert pedidos" ON pedidos;
CREATE POLICY "Anon can insert pedidos"
  ON pedidos FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update pedidos" ON pedidos;
CREATE POLICY "Anon can update pedidos"
  ON pedidos FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete pedidos" ON pedidos;
CREATE POLICY "Anon can delete pedidos"
  ON pedidos FOR DELETE TO anon USING (true);

-- ==================== PEDIDO_ITEMS ====================
DROP POLICY IF EXISTS "Anon can view pedido_items" ON pedido_items;
CREATE POLICY "Anon can view pedido_items"
  ON pedido_items FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert pedido_items" ON pedido_items;
CREATE POLICY "Anon can insert pedido_items"
  ON pedido_items FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update pedido_items" ON pedido_items;
CREATE POLICY "Anon can update pedido_items"
  ON pedido_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete pedido_items" ON pedido_items;
CREATE POLICY "Anon can delete pedido_items"
  ON pedido_items FOR DELETE TO anon USING (true);

-- ==================== MESAS ====================
DROP POLICY IF EXISTS "Anon can view mesas" ON mesas;
CREATE POLICY "Anon can view mesas"
  ON mesas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can update mesas" ON mesas;
CREATE POLICY "Anon can update mesas"
  ON mesas FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
