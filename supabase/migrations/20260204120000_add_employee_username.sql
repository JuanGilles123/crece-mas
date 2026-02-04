alter table public.team_members
add column if not exists employee_username text;

create unique index if not exists team_members_org_employee_username_key
on public.team_members (organization_id, employee_username)
where employee_username is not null;
