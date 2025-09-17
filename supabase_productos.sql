-- Tabla de productos mejorada
create table productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  precio_compra numeric not null,
  precio_venta numeric not null,
  stock integer not null,
  imagen text, -- URL de la imagen en el bucket
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_productos_user_id on productos(user_id);