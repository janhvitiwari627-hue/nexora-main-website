-- ============================================================================
-- Nexora — Customer PWA Phase 1 schema (shared project qwaehqsmodekbgvnaavz)
-- Date: 2026-08-02
--
-- Closes the Phase 0 gaps for the customer app WITHOUT creating duplicates:
--   * customer_settings          (missing live)  → create if not exists
--   * saved_payment_methods      (missing live)  → create if not exists
--   * customer_feedback          (missing live)  → create if not exists
--   * support_tickets.created_by (missing live)  → add column if not exists
--   * reviews persistence        (table live, empty) → add expected columns
--   * rewards / wallet           (missing live)  → server-side ledger + RPCs
--
-- Every statement is idempotent. Safe to re-apply. No duplicates, no reset,
-- no backend redesign. Locked business rules are untouched.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. customer_settings — one row per customer (PK user_id), settings jsonb.
-- ---------------------------------------------------------------------------
create table if not exists public.customer_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.customer_settings
  add column if not exists created_at timestamptz not null default now();

-- RLS: customers manage only their own settings row.
alter table public.customer_settings enable row level security;
do $x$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_settings'
      and policyname = 'customer_settings_owner'
  ) then
    create policy customer_settings_owner
      on public.customer_settings
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 2. saved_payment_methods — display-meta only (UPI id, masked card). No PANs.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  method     text not null check (method in ('upi', 'card')),
  label      text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_payment_methods_user_idx
  on public.saved_payment_methods (user_id, created_at desc);

alter table public.saved_payment_methods enable row level security;
do $x$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_payment_methods'
      and policyname = 'saved_payment_methods_owner'
  ) then
    create policy saved_payment_methods_owner
      on public.saved_payment_methods
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 3. customer_feedback — app feedback (rating 1-5 + message).
-- ---------------------------------------------------------------------------
create table if not exists public.customer_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  rating     smallint check (rating between 1 and 5),
  message    text,
  created_at timestamptz not null default now()
);

create index if not exists customer_feedback_user_idx
  on public.customer_feedback (user_id, created_at desc);

alter table public.customer_feedback enable row level security;
do $x$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_feedback'
      and policyname = 'customer_feedback_insert'
  ) then
    create policy customer_feedback_insert
      on public.customer_feedback
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 4. support_tickets — ensure the customer-facing columns exist.
-- ---------------------------------------------------------------------------
alter table public.support_tickets
  add column if not exists created_by uuid;
alter table public.support_tickets
  add column if not exists subject text;
alter table public.support_tickets
  add column if not exists category text not null default 'general';
alter table public.support_tickets
  add column if not exists description text;
alter table public.support_tickets
  add column if not exists status text not null default 'open';
alter table public.support_tickets
  add column if not exists priority text not null default 'normal';

-- Customers create + read their own tickets.
alter table public.support_tickets enable row level security;
do $x$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'support_tickets'
      and policyname = 'support_tickets_customer_own'
  ) then
    create policy support_tickets_customer_own
      on public.support_tickets
      for select
      using (auth.uid() = created_by);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'support_tickets'
      and policyname = 'support_tickets_customer_create'
  ) then
    create policy support_tickets_customer_create
      on public.support_tickets
      for insert
      with check (auth.uid() = created_by);
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 5. reviews — the live `reviews` table is anon-readable but the customer PWA
--    only kept reviews in session memory. Ensure the columns the PWA needs
--    exist WITHOUT re-creating the table (no duplicate).
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column if not exists salon_id uuid;
alter table public.reviews
  add column if not exists service_id uuid;
alter table public.reviews
  add column if not exists service_name text;
alter table public.reviews
  add column if not exists user_id uuid;
alter table public.reviews
  add column if not exists author text;
alter table public.reviews
  add column if not exists rating smallint check (rating between 1 and 5);
alter table public.reviews
  add column if not exists comment text;
alter table public.reviews
  add column if not exists verified boolean not null default false;

create index if not exists reviews_salon_idx on public.reviews (salon_id, created_at desc);
create index if not exists reviews_user_idx on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- 6. Rewards / Wallet — make it server-side proper.
--    profiles holds the balances; a ledger table records every movement and
--    money only ever changes through security-definer RPCs (never direct
--    client writes).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists loyalty_points integer not null default 0;
alter table public.profiles
  add column if not exists wallet_balance_paise bigint not null default 0;

create table if not exists public.rewards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,
  title       text not null,
  points      integer not null default 0 check (points >= 0),
  status      text not null default 'available'
              check (status in ('available', 'redeemed', 'expired')),
  redeemed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists rewards_user_idx on public.rewards (user_id, created_at desc);

create table if not exists public.wallet_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise >= 0),
  tx_type      text not null check (tx_type in ('credit', 'debit')),
  reason       text,
  ref_type     text,
  ref_id       uuid,
  created_at   timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx
  on public.wallet_transactions (user_id, created_at desc);

alter table public.rewards enable row level security;
alter table public.wallet_transactions enable row level security;
do $x$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rewards'
      and policyname = 'rewards_owner'
  ) then
    create policy rewards_owner on public.rewards
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wallet_transactions'
      and policyname = 'wallet_transactions_owner'
  ) then
    create policy wallet_transactions_owner on public.wallet_transactions
      for select using (auth.uid() = user_id);
  end if;
end
$x$;

-- Server-side wallet credit (security definer): ledger row + balance update in
-- one transaction. Client/anon cannot touch balances directly.
create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount_paise bigint,
  p_reason text default null,
  p_ref_type text default null,
  p_ref_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p_amount_paise is null or p_amount_paise <= 0 then
    raise exception 'amount must be positive';
  end if;
  insert into public.wallet_transactions (
    user_id, amount_paise, tx_type, reason, ref_type, ref_id
  ) values (p_user_id, p_amount_paise, 'credit', p_reason, p_ref_type, p_ref_id);
  update public.profiles
    set wallet_balance_paise = coalesce(wallet_balance_paise, 0) + p_amount_paise,
        updated_at = now()
    where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;
end
$fn$;

-- Server-side points credit.
create or replace function public.credit_reward_points(
  p_user_id uuid,
  p_points integer,
  p_type text default 'earned',
  p_title text default 'Reward points'
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p_points is null or p_points <= 0 then
    raise exception 'points must be positive';
  end if;
  insert into public.rewards (user_id, type, title, points)
    values (p_user_id, coalesce(nullif(p_type, ''), 'earned'), p_title, p_points);
  update public.profiles
    set loyalty_points = coalesce(loyalty_points, 0) + p_points,
        updated_at = now()
    where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;
end
$fn$;
