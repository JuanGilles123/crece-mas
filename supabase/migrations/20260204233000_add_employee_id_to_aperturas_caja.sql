alter table public.aperturas_caja
add column if not exists employee_id uuid references public.employees(id) on delete cascade;

alter table public.aperturas_caja
alter column user_id drop not null;

create index if not exists idx_aperturas_caja_employee
  on public.aperturas_caja(employee_id);

alter table public.aperturas_caja
drop constraint if exists aperturas_caja_user_or_employee_check;

alter table public.aperturas_caja
add constraint aperturas_caja_user_or_employee_check
check (user_id is not null or employee_id is not null);
