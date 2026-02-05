alter table public.ventas
add column if not exists employee_id uuid references public.employees(id) on delete set null;

alter table public.ventas
alter column user_id drop not null;

create index if not exists idx_ventas_employee
  on public.ventas(employee_id);

alter table public.ventas
drop constraint if exists ventas_user_or_employee_check;

alter table public.ventas
add constraint ventas_user_or_employee_check
check (user_id is not null or employee_id is not null);
