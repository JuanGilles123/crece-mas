alter table organizations
add column if not exists jewelry_price_mode text default 'fixed';

alter table organizations
add column if not exists jewelry_min_margin numeric;

alter table organizations
add column if not exists jewelry_gold_price_global numeric;

alter table organizations
add column if not exists jewelry_gold_price_local numeric;

alter table organizations
add column if not exists jewelry_gold_price_reference text default 'international';
