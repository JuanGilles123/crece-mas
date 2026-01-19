-- Script para actualizar la base de datos sin errores si ya existe

-- Crear tabla de ventas solo si no existe
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  total numeric not null,
  metodo_pago text not null,
  items jsonb not null, -- Array de productos vendidos
  fecha timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Agregar constraint para stock positivo solo si no existe
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'check_stock_positive'
  ) then
    alter table productos add constraint check_stock_positive check (stock >= 0);
  end if;
end $$;

-- Crear índices solo si no existen
create index if not exists idx_ventas_user_id on ventas(user_id);
create index if not exists idx_ventas_fecha on ventas(fecha);

-- Habilitar RLS solo si no está habilitado
do $$
begin
  if not exists (
    select 1 from pg_class 
    where relname = 'ventas' and relrowsecurity = true
  ) then
    alter table ventas enable row level security;
  end if;
end $$;

-- Crear políticas solo si no existen
do $$
begin
  -- Política de selección
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ventas' and policyname = 'Los usuarios pueden ver sus propias ventas'
  ) then
    create policy "Los usuarios pueden ver sus propias ventas" on ventas
      for select using (auth.uid() = user_id);
  end if;

  -- Política de inserción
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ventas' and policyname = 'Los usuarios pueden insertar sus propias ventas'
  ) then
    create policy "Los usuarios pueden insertar sus propias ventas" on ventas
      for insert with check (auth.uid() = user_id);
  end if;

  -- Política de actualización
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ventas' and policyname = 'Los usuarios pueden actualizar sus propias ventas'
  ) then
    create policy "Los usuarios pueden actualizar sus propias ventas" on ventas
      for update using (auth.uid() = user_id);
  end if;

  -- Política de eliminación
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ventas' and policyname = 'Los usuarios pueden eliminar sus propias ventas'
  ) then
    create policy "Los usuarios pueden eliminar sus propias ventas" on ventas
      for delete using (auth.uid() = user_id);
  end if;
end $$;
