alter table organizations
add column if not exists jewelry_min_margin_local numeric;

alter table organizations
add column if not exists jewelry_min_margin_international numeric;
