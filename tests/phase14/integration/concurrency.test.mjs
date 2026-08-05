// Phase 14 Integration Tests - Concurrency
// Tests genuinely simultaneous requests for same slot
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Concurrency - Live Integration Tests', () => {
  let clientA;
  let clientB;
  let env;
  
  test.before(async () => {
    env = getEnv();
    const configured = isLiveTestConfigured();
    
    if (!configured.hasSupabase || !configured.hasTestAccounts) {
      console.log('BLOCKED: Need Supabase + test accounts');
      return;
    }
    
    clientA = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    clientB = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Sign in both customers
    await clientA.auth.signInWithPassword({
      email: env.ACCEPTANCE_CUSTOMER_A_EMAIL,
      password: env.ACCEPTANCE_CUSTOMER_A_PASSWORD
    });
    
    await clientB.auth.signInWithPassword({
      email: env.ACCEPTANCE_CUSTOMER_B_EMAIL,
      password: env.ACCEPTANCE_CUSTOMER_B_PASSWORD
    });
  });
  
  test('two customers competing for same slot - exactly one wins', async (t) => {
    if (!clientA || !clientB) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const sameSlot = new Date(Date.now() + 86400000).toISOString();
    let results = [];
    
    // Genuinely concurrent requests
    const promiseA = clientA.rpc('create_booking', {
      customer_id: env.ACCEPTANCE_CUSTOMER_A_EMAIL, // Would be user ID in real test
      salon_id: 'test-salon',
      service_id: 'test-service',
      appointment_start: sameSlot,
      idempotency_key: `key-a-${Date.now()}`
    }).then(r => ({ status: 'fulfilled', result: r })).catch(e => ({ status: 'rejected', error: e }));
    
    const promiseB = clientB.rpc('create_booking', {
      customer_id: env.ACCEPTANCE_CUSTOMER_B_EMAIL,
      salon_id: 'test-salon',
      service_id: 'test-service',
      appointment_start: sameSlot,
      idempotency_key: `key-b-${Date.now()}`
    }).then(r => ({ status: 'fulfilled', result: r })).catch(e => ({ status: 'rejected', error: e }));
    
    const [resultA, resultB] = await Promise.allSettled([promiseA, promiseB]);
    
    // Count successful bookings
    const successfulBookings = [resultA, resultB].filter(r => 
      r.status === 'fulfilled' && r.value && !r.value.error
    ).length;
    
    // Exactly one should succeed
    assert.ok(
      successfulBookings === 1,
      `Expected exactly 1 successful booking, got ${successfulBookings}. ` +
      `Result A: ${JSON.stringify(resultA)}, Result B: ${JSON.stringify(resultB)}`
    );
  });
  
  test.after(() => {
    if (clientA) clientA.auth.signOut();
    if (clientB) clientB.auth.signOut();
  });
});
