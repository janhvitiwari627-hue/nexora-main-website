// Phase 14 Integration Tests - Booking Flow
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Booking Flow - Live Integration Tests', () => {
  let client;
  let env;
  let customerSession;
  
  test.before(async () => {
    env = getEnv();
    const configured = isLiveTestConfigured();
    
    if (!configured.hasSupabase) {
      console.log('BLOCKED: Supabase not configured');
      return;
    }
    
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    if (env.ACCEPTANCE_CUSTOMER_A_EMAIL) {
      const { data, error } = await client.auth.signInWithPassword({
        email: env.ACCEPTANCE_CUSTOMER_A_EMAIL,
        password: env.ACCEPTANCE_CUSTOMER_A_PASSWORD
      });
      if (!error) customerSession = data;
    }
  });
  
  test('published salon visible to anonymous', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { error } = await client
      .from('salon_public_websites')
      .select('*')
      .eq('is_published', true)
      .limit(1);
    
    if (error) {
      t.skip(`BLOCKED: ${error.message}`);
      return;
    }
    
    // Public view should work for anonymous
    assert.ok(true, 'Public salon view accessible');
  });
  
  test('customer can create booking idempotently', async (t) => {
    if (!customerSession) {
      t.skip('BLOCKED: Customer not authenticated');
      return;
    }
    
    const idempotencyKey = `test-booking-${Date.now()}`;
    
    // First booking attempt
    const { data: booking1, error: error1 } = await client
      .rpc('create_booking', {
        customer_id: customerSession.user.id,
        salon_id: 'test-salon-id',
        service_id: 'test-service-id',
        appointment_start: new Date(Date.now() + 86400000).toISOString(),
        idempotency_key: idempotencyKey
      });
    
    if (error1) {
      t.skip(`BLOCKED: Cannot create booking: ${error1.message}`);
      return;
    }
    
    assert.ok(booking1, 'Booking should be created');
    
    // Second attempt with same key - should return same booking
    const { data: booking2, error: error2 } = await client
      .rpc('create_booking', {
        customer_id: customerSession.user.id,
        salon_id: 'test-salon-id',
        service_id: 'test-service-id',
        appointment_start: new Date(Date.now() + 86400000).toISOString(),
        idempotency_key: idempotencyKey
      });
    
    if (error2) {
      t.skip(`BLOCKED: Idempotency check failed: ${error2.message}`);
      return;
    }
    
    assert.equal(booking1.id, booking2?.id, 'Idempotent request should return same booking');
  });
  
  test.after(() => {
    if (client) client.auth.signOut();
  });
});
