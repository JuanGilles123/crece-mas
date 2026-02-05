alter table public.subscriptions
add column if not exists expiration_notice_sent_at timestamptz;
