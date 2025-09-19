-- Script para agregar el campo pago_cliente a la tabla ventas

-- Agregar columna pago_cliente solo si no existe
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'ventas' and column_name = 'pago_cliente'
  ) then
    alter table ventas add column pago_cliente numeric;
  end if;
end $$;

-- Comentario para documentar el campo
comment on column ventas.pago_cliente is 'Monto entregado por el cliente (para calcular cambio en pagos en efectivo)';
