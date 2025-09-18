-- Crear tabla de ventas (solo si no existe)
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  total numeric not null,
  metodo_pago text not null,
  items jsonb not null, -- Array de productos vendidos
  fecha timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Agregar constraint para asegurar que el stock no sea negativo en productos (solo si no existe)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'check_stock_positive'
  ) then
    alter table productos add constraint check_stock_positive check (stock >= 0);
  end if;
end $$;

-- Crear índice para búsquedas por usuario
create index idx_ventas_user_id on ventas(user_id);
create index idx_ventas_fecha on ventas(fecha);

-- Habilitar RLS (Row Level Security)
alter table ventas enable row level security;

-- Política: Los usuarios solo pueden ver sus propias ventas
create policy "Los usuarios pueden ver sus propias ventas" on ventas
  for select using (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias ventas
create policy "Los usuarios pueden insertar sus propias ventas" on ventas
  for insert with check (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias ventas
create policy "Los usuarios pueden actualizar sus propias ventas" on ventas
  for update using (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias ventas
create policy "Los usuarios pueden eliminar sus propias ventas" on ventas
  for delete using (auth.uid() = user_id);
