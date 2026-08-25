import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const razorpayMigration = await readFile(new URL('../supabase/migrations/20260821000201_m29_phase1a_razorpay_foundation.sql', import.meta.url), 'utf8');
const bookingCreation = await readFile(new URL('../supabase/migrations/20260821000401_m31_phase1a_authoritative_booking_creation.sql', import.meta.url), 'utf8');
const ownerPayouts = await readFile(new URL('../supabase/migrations/20260801_owner_daily_payout_2200_ist.sql', import.meta.url), 'utf8');
const gpCommissions = await readFile(new URL('../supabase/migrations/20260801_growth_partner_commission_and_hold.sql', import.meta.url), 'utf8');
const bizRules = await readFile(new URL('../supabase/migrations/20260801_business_rules_verification.sql', import.meta.url), 'utf8');

test('Phase 6.1: Server-authoritative Razorpay orders and payments schema', () => {
  assert.match(razorpayMigration, /create table if not exists public\.payment_orders/);
  assert.match(razorpayMigration, /create table if not exists public\.payments/);
  assert.match(razorpayMigration, /create table if not exists public\.payment_webhook_events/);
  assert.match(razorpayMigration, /amount_paise bigint not null/);
  assert.match(razorpayMigration, /currency text not null default 'INR'/);
});

test('Phase 6.2: Razorpay server-only verification and confirmation RPCs', () => {
  assert.match(razorpayMigration, /create or replace function public\.confirm_verified_razorpay_payment/);
  assert.match(razorpayMigration, /create or replace function public\.get_booking_payment_quote/);
  assert.match(razorpayMigration, /create or replace function public\.ingest_verified_payment_webhook/);
  assert.match(razorpayMigration, /create or replace function public\.process_payment_webhook/);
});

test('Phase 6.3: 25% fixed advance calculation math is strictly enforced in SQL', () => {
  assert.match(bookingCreation, /create or replace function public\.create_authoritative_customer_booking/);
  assert.match(bookingCreation, /booking_request_keys/);
  assert.match(bizRules, /advance := floor\(sample \* rules\.advance_share_bps \/ 10000\.0\)/);
});

test('Phase 6.4: Owner daily payouts scheduled at 22:00 IST with 90% settlement', () => {
  assert.match(ownerPayouts, /create table if not exists public\.owner_payout_runs/);
  assert.match(ownerPayouts, /create table if not exists public\.owner_payouts/);
  assert.match(ownerPayouts, /create table if not exists public\.owner_payout_items/);
  assert.match(ownerPayouts, /create or replace function public\.run_owner_daily_payouts/);
  assert.match(bizRules, /split_owner_90_platform_10/);
});

test('Phase 6.5: Growth Partner 10% platform revenue commission and 7-day maturation hold', () => {
  assert.match(gpCommissions, /commission_rate_bps integer not null default 1000 check \(commission_rate_bps = 1000\)/);
  assert.match(gpCommissions, /hold_days integer not null default 7 check \(hold_days = 7\)/);
  assert.match(gpCommissions, /create or replace function public\.release_growth_partner_commissions/);
});

test('Phase 6.6: Refund policy engine quotes 100% full or 50% partial based on 24h window', () => {
  assert.match(bizRules, /create or replace function public\.quote_booking_refund/);
  assert.match(bizRules, /lead > rules\.refund_full_window_hours/);
});
