update public.team_members
set status = 'inactive'
where is_employee = true;

update public.employees
set active = false
where active = true;

delete from public.employee_sessions;
