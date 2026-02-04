drop index if exists public.team_members_org_employee_username_key;
create unique index if not exists team_members_org_employee_username_key
on public.team_members (organization_id, employee_username)
where employee_username is not null and status = 'active';

drop index if exists public.employees_organization_id_code_key;
create unique index if not exists employees_organization_id_code_key
on public.employees (organization_id, code)
where active = true;
