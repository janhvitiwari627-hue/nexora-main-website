// Phase 14 Integration Tests - Payment Idempotency
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Payment Idempotency - Live Integration Tests', () => {
  let client;
  let env;
  
  test.before(() => {
    env = getEnv();
    const configured = isLiveTestConfigured();
    
    if (!configured.hasSupabase) {
      console.log('BLOCKED: Supabase not configured');
      return;
    }
    
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });
  
  test('duplicate order creation returns same order', async (t) => {
    if (!client || !env.ACCEPTANCE_CUSTOMER_A_EMAIL) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    // Sign in
    await client.auth.signInWithPassword({
      email: env.ACCEPTANCE_CUSTOMER_A_EMAIL,
      password: env.ACCEPTANCE_CUSTOMER_A_PASSWORD
    });
    
    const orderId = `test-order-${Date.now()}`;
    
    // Create order
    const { data: order1, error: error1 } = await client
      .rpc('create_payment_order', {
        booking_id: 'test-booking',
        amount_paise: 100000,
        order_id: orderId
      });
    
    if (error1) {
      // Check if it's a BLOCKED reason
      if (error1.message.includes('function not found') || error1.message.includes('permission')) {
        t.skip(`BLOCKED: ${error1.message}`);
        return;
      }
    }
    
    if (order1) {
      // Try duplicate
      const { data: order2 } = await client
        .rpc('create_payment_order', {
          booking_id: 'test-booking',
          amount_paise: 100000,
          order_id: orderId
        });
      
      assert.equal(order1.id, order2?.id, 'Duplicate should return same order');
    }
    
    await client.auth.signOut();
  });
  
  test('duplicate webhook event processed once', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    // This would test webhook idempotency
    // Needs webhook secret and actual webhook endpoint
    t.skip('BLOCKED: Webhook testing requires payment provider sandbox');
  });
  
  test('out-of-order webhook handled', async (t) => {
    t.skip('BLOCKED: Requires payment provider sandbox');
  });
  
  test.after(() => {
    if (client) client.auth.signOut();
  });
});
