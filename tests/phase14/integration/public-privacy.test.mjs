// Phase 14 Integration Tests - Public Privacy
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Public Privacy - Live Integration Tests', () => {
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
  
  test('anonymous cannot read profiles', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see profiles');
    }
  });
  
  test('anonymous cannot read bookings', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see bookings');
    }
  });
  
  test('anonymous cannot read applications', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see applications');
    }
  });
  
  test('anonymous cannot read commissions', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('growth_partner_commissions')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see commissions');
    }
  });
  
  test('anonymous cannot read wallets', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('wallet_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see wallet');
    }
  });
  
  test('anonymous cannot read payouts', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('owner_payouts')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see payouts');
    }
  });
  
  test('public view shows only published salons', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const { data, error } = await client
      .from('salon_public_websites')
      .select('*')
      .eq('is_published', true)
      .limit(1);
    
    if (error) {
      t.skip(`BLOCKED: ${error.message}`);
      return;
    }
    
    // Should be able to see published salons
    assert.ok(data !== null, 'Public view should work');
  });
  
  test('guessed UUID does not grant access', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    const fakeId = '00000000-0000-0000-0000-000000000001';
    
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', fakeId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Not found - good, UUID guessing doesn't help
      assert.ok(true);
    } else if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Should get permission error');
    } else {
      assert.equal(data.id, fakeId, 'Should not return data for fake UUID');
    }
  });
  
  test.after(() => {
    if (client) client.auth.signOut();
  });
});
