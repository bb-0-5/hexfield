-- Stripe sandbox paid-order ledger; never creates physical supplier orders.
create table if not exists public.hexfield_print_orders (
  stripe_checkout_session_id text primary key,
  stripe_event_id text,
  format text not null check (format in ('print','logo')),
  design_url text not null,
  amount_total bigint,
  currency text,
  payment_status text not null default 'paid',
  customer_email text,
  shipping jsonb,
  stripe_session jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hexfield_print_orders enable row level security;
revoke all on public.hexfield_print_orders from anon, authenticated;
