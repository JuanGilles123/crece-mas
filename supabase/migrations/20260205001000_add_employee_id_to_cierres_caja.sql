alter table public.cierres_caja
add column if not exists employee_id uuid references public.employees(id) on delete set null;

alter table public.cierres_caja
alter column user_id drop not null;

create index if not exists idx_cierres_caja_employee
  on public.cierres_caja(employee_id);

alter table public.cierres_caja
drop constraint if exists cierres_caja_user_or_employee_check;

alter table public.cierres_caja
add constraint cierres_caja_user_or_employee_check
check (user_id is not null or employee_id is not null);
