alter table organizations
add column if not exists jewelry_weight_unit text default 'g';
