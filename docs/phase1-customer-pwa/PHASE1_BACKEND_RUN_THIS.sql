-- ============================================================================
-- NEXORA — PHASE 1 CUSTOMER BACKEND (RUN THIS FILE ONCE IN SUPABASE)
-- ----------------------------------------------------------------------------
-- Kaise run karein:
--   1. Supabase Dashboard kholo -> apna project (qwaehqsmodekbgvnaavz)
--   2. Left menu -> SQL Editor -> "New query"
--   3. Ye PURA file copy karke paste karo -> "Run" dabao
--   4. Aakhir me results table aayega — har row "COMPLETE" honi chahiye.
--
-- Ye file sirf ek convenience runner hai: isme neeche dono migrations
-- pehle se shaamil hain, sahi order me:
--   PART 1: supabase/migrations/20260802_customer_phase1_schema.sql
--   PART 2: supabase/migrations/20260803_customer_phase1_completion.sql
-- Dono idempotent hain — dobara Run karna safe hai, kuch duplicate nahi hoga.
-- ============================================================================

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

-- ============================================================================
-- ========================  PART 2 STARTS HERE  ==============================
-- ============================================================================

-- ============================================================================
-- Nexora — Customer PWA Phase 1 COMPLETION (shared project qwaehqsmodekbgvnaavz)
-- Date: 2026-08-03
--
-- Closes the three gaps found while verifying the Phase-1 checklist against
-- the customer PWA (freewebsite859-sudo/custmer-Fresh-app- @ 4eff314) and the
-- shared backend. No new booking/payment objects; the existing tested booking
-- contract (create_customer_booking + razorpay-create-order) is untouched, as
-- are the six locked business rules.
--
--   1. customer_reviews — the merged customer app (reviewsRepository.ts) reads
--      and writes `public.customer_reviews`, but that table only existed as an
--      unapplied SQL file (db/customer_reviews.sql) in the app repo, so
--      reviews silently stayed session-only ("degrades gracefully"). This
--      provisions the EXACT contract the app already targets.
--
--   2. Ledger integrity — profiles.loyalty_points and
--      profiles.wallet_balance_paise could be rewritten by any logged-in
--      client with direct UPDATE statements (the current RewardsScreen does
--      exactly this, and nothing stops a malicious client from minting
--      balances). A BEFORE UPDATE trigger now rejects balance changes unless
--      the write comes from service_role or from a server RPC that set the
--      nexora.balance_writer marker inside its transaction.
--
--   3. Mint RPC lockdown — public.credit_wallet / public.credit_reward_points
--      are caller-parametrised (p_user_id) and, via the default PUBLIC
--      EXECUTE grant, were callable by any authenticated user to credit
--      arbitrary balances. They are now service_role-only. Self-service
--      redemption moves to the new balance-checked, tier-locked function
--      public.redeem_loyalty_points.
--
--   4. verify_customer_phase1_backend() — run-time self test mirroring
--      public.verify_business_rules(); every row must read COMPLETE.
--
-- Every statement is idempotent. Safe to re-apply. No data is reset.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. customer_reviews — exact contract consumed by the customer PWA
--    (src/lib/reviewsRepository.ts; DDL previously stranded in the app repo).
-- ---------------------------------------------------------------------------
create table if not exists public.customer_reviews (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  salon_id text not null,
  service_id text,
  service_name text not null,
  author text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  verified_booking boolean not null default false,
  booking_id text,
  created_at timestamptz not null default now()
);

create index if not exists customer_reviews_user_idx
  on public.customer_reviews (user_id, created_at desc);
create index if not exists customer_reviews_salon_idx
  on public.customer_reviews (salon_id, created_at desc);

alter table public.customer_reviews enable row level security;

drop policy if exists "customer_reviews_select_own" on public.customer_reviews;
create policy "customer_reviews_select_own"
  on public.customer_reviews for select
  using (auth.uid() = user_id);

drop policy if exists "customer_reviews_insert_own" on public.customer_reviews;
create policy "customer_reviews_insert_own"
  on public.customer_reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "customer_reviews_update_own" on public.customer_reviews;
create policy "customer_reviews_update_own"
  on public.customer_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "customer_reviews_delete_own" on public.customer_reviews;
create policy "customer_reviews_delete_own"
  on public.customer_reviews for delete
  using (auth.uid() = user_id);

-- Realtime (multi-device sync): the app subscribes to its own review changes.
do $pub$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'customer_reviews'
     ) then
    alter publication supabase_realtime add table public.customer_reviews;
  end if;
end
$pub$;

-- ---------------------------------------------------------------------------
-- 2. Balance guard — loyalty_points / wallet_balance_paise are server-managed.
--    Any UPDATE that changes them must carry the transaction-local marker set
--    by the Nexora server RPCs below, or arrive over service_role (trusted
--    server code, e.g. future payment webhooks).
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_balance_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_marker text;
  v_role text := '';
begin
  if new.loyalty_points is not distinct from old.loyalty_points
     and new.wallet_balance_paise is not distinct from old.wallet_balance_paise then
    return new;
  end if;

  -- Dashboard / SQL editor sessions run as the owner role; keep manual ops
  -- possible there. API traffic (PostgREST) never matches these.
  if session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  v_marker := coalesce(current_setting('nexora.balance_writer', true), '');

  begin
    v_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      '');
  exception when others then
    v_role := '';
  end;
  if v_role = '' then
    v_role := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  end if;

  if v_marker <> 'nexora-server-rpc' and v_role <> 'service_role' then
    raise exception
      'profiles.loyalty_points and profiles.wallet_balance_paise are server-managed; use the Nexora reward/wallet RPCs';
  end if;
  return new;
end
$fn$;

drop trigger if exists trg_nexora_guard_profile_balance_columns on public.profiles;
create trigger trg_nexora_guard_profile_balance_columns
  before update on public.profiles
  for each row
  execute function public.guard_profile_balance_columns();

-- ---------------------------------------------------------------------------
-- 3a. Re-issue the mint RPCs with the balance-writer marker. Signatures are
--     unchanged from 20260802_customer_phase1_schema.sql.
-- ---------------------------------------------------------------------------
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
  perform set_config('nexora.balance_writer', 'nexora-server-rpc', true);
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
  perform set_config('nexora.balance_writer', 'nexora-server-rpc', true);
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

-- 3b. Mint lockdown — these take an arbitrary p_user_id, so they are
--     service_role-only. Revoking the default PUBLIC grant requires an
--     explicit grant back to service_role (server Edge Functions keep working).
revoke all on function public.credit_wallet(uuid, bigint, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.credit_wallet(uuid, bigint, text, text, uuid)
  to service_role;

revoke all on function public.credit_reward_points(uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.credit_reward_points(uuid, integer, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3c. public.redeem_loyalty_points — the ONLY client-callable balance mutation.
--     Self-service: the caller is always the affected user (auth.uid()), the
--     balance is re-read under a row lock, and only the exact voucher tiers
--     published in the customer app are accepted, so points cannot be
--     converted at an arbitrary rate:
--       500 pts -> ₹100 (10,000 paise) · 1000 pts -> ₹250 (25,000 paise)
--     New tiers require a schema change here — by design.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_loyalty_points(
  p_points integer,
  p_wallet_credit_paise bigint,
  p_title text default 'Reward redemption'
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user uuid := auth.uid();
  v_current integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points <= 0 then
    raise exception 'points must be positive';
  end if;
  if p_wallet_credit_paise is null or p_wallet_credit_paise <= 0 then
    raise exception 'wallet credit must be positive';
  end if;
  if not (p_points = 500 and p_wallet_credit_paise = 10000)
     and not (p_points = 1000 and p_wallet_credit_paise = 25000) then
    raise exception 'invalid redemption tier';
  end if;

  perform set_config('nexora.balance_writer', 'nexora-server-rpc', true);

  select loyalty_points into v_current
    from public.profiles
    where id = v_user
    for update;
  if not found then
    raise exception 'profile not found';
  end if;
  if coalesce(v_current, 0) < p_points then
    raise exception 'insufficient points';
  end if;

  update public.profiles
    set loyalty_points = loyalty_points - p_points,
        wallet_balance_paise = coalesce(wallet_balance_paise, 0) + p_wallet_credit_paise,
        updated_at = now()
    where id = v_user;

  insert into public.rewards (user_id, type, title, points, status, redeemed_at)
    values (
      v_user,
      'redeemed',
      coalesce(nullif(p_title, ''), 'Reward redemption'),
      p_points,
      'redeemed',
      now()
    );

  insert into public.wallet_transactions (user_id, amount_paise, tx_type, reason, ref_type)
    values (
      v_user,
      p_wallet_credit_paise,
      'credit',
      coalesce(nullif(p_title, ''), 'Reward redemption'),
      'reward_redeem'
    );
end
$fn$;

revoke all on function public.redeem_loyalty_points(integer, bigint, text)
  from public, anon;
grant execute on function public.redeem_loyalty_points(integer, bigint, text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Self test — one row per Phase-1 backend object; every row must read
--    COMPLETE. Mirrors public.verify_business_rules().
-- ---------------------------------------------------------------------------
create or replace function public.verify_customer_phase1_backend()
returns table (
  check_no integer,
  check_id text,
  check_name text,
  status text,
  detail text
)
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  return query
  with checks (check_no, check_id, check_name, ok, fix_hint) as (
    values
      (1, 'customer_settings', 'Preferences table',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'customer_settings'),
       'apply 20260802_customer_phase1_schema.sql'),
      (2, 'saved_payment_methods', 'Saved payment methods table',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'saved_payment_methods'),
       'apply 20260802_customer_phase1_schema.sql'),
      (3, 'customer_feedback', 'Customer feedback table',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'customer_feedback'),
       'apply 20260802_customer_phase1_schema.sql'),
      (4, 'support_tickets.created_by', 'Support tickets customer column',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'support_tickets'
                 and column_name = 'created_by'),
       'apply 20260802_customer_phase1_schema.sql'),
      (5, 'reviews.salon_id', 'Salon reviews columns (live table)',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'reviews'
                 and column_name = 'salon_id')
       and exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'reviews'
                 and column_name = 'user_id'),
       'apply 20260802_customer_phase1_schema.sql'),
      (6, 'customer_reviews', 'Customer PWA reviews table (app contract)',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'customer_reviews'),
       'apply 20260803_customer_phase1_completion.sql'),
      (7, 'rewards', 'Rewards ledger table',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'rewards'),
       'apply 20260802_customer_phase1_schema.sql'),
      (8, 'wallet_transactions', 'Wallet ledger table',
       exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'wallet_transactions'),
       'apply 20260802_customer_phase1_schema.sql'),
      (9, 'profiles.loyalty_points', 'Points balance column',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'profiles'
                 and column_name = 'loyalty_points'),
       'apply 20260802_customer_phase1_schema.sql'),
      (10, 'profiles.wallet_balance_paise', 'Wallet balance column',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'profiles'
                 and column_name = 'wallet_balance_paise'),
       'apply 20260802_customer_phase1_schema.sql'),
      (11, 'credit_wallet', 'Wallet credit RPC',
       exists (select 1 from pg_proc p
               join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'credit_wallet'),
       'apply 20260802_customer_phase1_schema.sql'),
      (12, 'credit_reward_points', 'Points credit RPC',
       exists (select 1 from pg_proc p
               join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'credit_reward_points'),
       'apply 20260802_customer_phase1_schema.sql'),
      (13, 'balance_guard', 'Balance guard trigger on profiles',
       exists (select 1 from pg_trigger t
               join pg_class c on c.oid = t.tgrelid
               join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = 'profiles'
                 and t.tgname = 'trg_nexora_guard_profile_balance_columns'),
       'apply 20260803_customer_phase1_completion.sql'),
      (14, 'mint_lockdown', 'Mint RPCs blocked for end users',
       not has_function_privilege(
             'authenticated', 'public.credit_wallet(uuid,bigint,text,text,uuid)', 'execute')
       and not has_function_privilege(
             'authenticated', 'public.credit_reward_points(uuid,integer,text,text)', 'execute'),
       'apply 20260803_customer_phase1_completion.sql'),
      (15, 'redeem_loyalty_points', 'Self-service redemption RPC',
       has_function_privilege(
         'authenticated', 'public.redeem_loyalty_points(integer,bigint,text)', 'execute'),
       'apply 20260803_customer_phase1_completion.sql')
  )
  select
    c.check_no,
    c.check_id,
    c.check_name,
    case when c.ok then 'COMPLETE' else 'MISSING' end,
    case when c.ok then 'verified on shared project qwaehqsmodekbgvnaavz'
         else c.fix_hint end
  from checks c
  order by c.check_no;
end
$fn$;

revoke all on function public.verify_customer_phase1_backend()
  from public, anon;
grant execute on function public.verify_customer_phase1_backend()
  to authenticated, service_role;

-- ============================================================================
-- FINAL CHECK — is query ke results me har row ka status "COMPLETE" hona
-- chahiye. Koi bhi "MISSING" row aaye to us row ka fix_hint dekho.
-- ============================================================================
select * from public.verify_customer_phase1_backend();
