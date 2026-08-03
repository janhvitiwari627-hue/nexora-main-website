# Customer PWA — Phase 1 closing patch (apply in `custmer-Fresh-app-`)

**Why:** `nexora-main-website` migration `20260803_customer_phase1_completion.sql`
adds a balance guard on `profiles`: direct client writes to
`loyalty_points` / `wallet_balance_paise` are now **rejected**. The app's
redeem flow must go through the new server RPC (balance re-checked under a row
lock, tier-locked, ledger-writing). Target file:
`src/components/RewardsScreen.tsx` (verified against `main` = `4eff314`).

## Patch 1 — `handleRedeem` via `redeem_loyalty_points` (required)

Replace the current `handleRedeem` body (the `supabase.from('profiles').update(...)`
block, ≈ L303–347) with:

```tsx
  const handleRedeem = async (opt: { pts: number; discount: number; label: string }) => {
    if (!supabase || !profile) return;
    // Server enforces tier validity + balance atomically (Phase-1 backend:
    // public.redeem_loyalty_points). Direct profiles writes are rejected by
    // the balance guard trigger — always go through the RPC.
    const { error } = await supabase.rpc('redeem_loyalty_points', {
      p_points: opt.pts,
      p_wallet_credit_paise: opt.discount * 100,
      p_title: opt.label,
    });
    if (error) {
      const msg = /insufficient points/i.test(error.message ?? '')
        ? 'Not enough Glow Points for this voucher yet.'
        : 'Reward could not be redeemed. Please try again.';
      triggerToast(msg);
      return;
    }
    setRedeemedDiscount(opt.discount);
    setShowRedeemModal(false);
  };
```

The profile realtime subscription already installed in `App.tsx` (`subscribeToProfile`)
pushes the new balances back into the UI — no local balance math anywhere.

## Patch 2 — remove client-side points earning (recommended now)

`handleSimulateInviteFriend` (≈ L270–300) hand-writes `loyalty_points + 250`.
With the guard live that UPDATE fails with a clear server error. Until
server-side accrual ships (tracked as a product decision — see
`docs/PHASE1_CUSTOMER_PWA_COMPLETION_STATUS.md`, Task 7), replace the whole
`if (supabase) { … } else { … }` block with an honest pending state:

```tsx
    // Points are credited by the server when the referral's booking completes.
    // No client-side balance writes (blocked by the balance guard trigger).
    triggerToast('Referral recorded! Glow Points credit after their first completed booking.');
```

## Do NOT change

- `bookingRepository.ts` — the booking/payment contract
  (`create_customer_booking` → `razorpay-create-order`) is the locked, tested
  pipeline. Nothing in this patch series touches it.
- `supabaseClient.ts` — shared-project validation stays as the only env path.

## Verify after deploying

1. Redeem with insufficient points → toast "Not enough Glow Points…", no balance change.
2. Redeem a valid tier → `profiles` balances change on every device within seconds;
   one `rewards` row (`type='redeemed'`) + one `wallet_transactions` row appear.
3. DevTools console: attempt `supabase.from('profiles').update({ loyalty_points: 999 })`
   → server rejects (balance guard). This proves ledger integrity.
