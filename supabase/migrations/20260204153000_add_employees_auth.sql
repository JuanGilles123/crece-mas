-- Tabla de empleados para autenticación propia (sin Supabase Auth)
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  team_member_id uuid references team_members(id) on delete set null,
  code text not null,
  password_hash text not null,
  role text not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists employees_code_unique on employees (code);
create index if not exists employees_org_id_idx on employees (organization_id);
create index if not exists employees_team_member_id_idx on employees (team_member_id);

-- Sesiones de empleados (token hash)
create table if not exists employee_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists employee_sessions_token_hash_idx on employee_sessions (token_hash);
