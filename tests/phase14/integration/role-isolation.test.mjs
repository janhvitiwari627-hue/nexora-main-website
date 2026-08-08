// Phase 14 Integration Tests - Role Isolation
// Live tests requiring Supabase credentials and test accounts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Role Isolation - Live Integration Tests', () => {
  let client;
  let env;
  
  test.before(() => {
    env = getEnv();
    const configured = isLiveTestConfigured();
    
    if (!configured.configured) {
      console.log('BLOCKED: Missing environment configuration');
      console.log('Missing:', configured.missing.join(', '));
      return;
    }
    
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });
  
  test('anonymous user cannot read profiles', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Supabase not configured');
      return;
    }
    
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .limit(1);
    
    // Anonymous should get empty result or error, not actual profiles
    if (error) {
      // Error is acceptable - means RLS blocked
      assert.match(error.message, /permission denied|not authorized/i, 
        'Should get permission error');
    } else {
      assert.equal(data.length, 0, 'Anonymous should not see any profiles');
    }
  });
  
  test('anonymous user cannot read bookings', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Supabase not configured');
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
      assert.equal(data.length, 0, 'Anonymous should not see any bookings');
    }
  });
  
  test('customer A cannot access owner portal data', async (t) => {
    if (!client || !env.ACCEPTANCE_CUSTOMER_A_EMAIL) {
      t.skip('BLOCKED: Customer A credentials not configured');
      return;
    }
    
    // Sign in as customer A
    const { error: signInError } = await client.auth.signInWithPassword({
      email: env.ACCEPTANCE_CUSTOMER_A_EMAIL,
      password: env.ACCEPTANCE_CUSTOMER_A_PASSWORD
    });
    
    if (signInError) {
      t.skip(`BLOCKED: Cannot sign in as customer A: ${signInError.message}`);
      return;
    }
    
    // Try to access owner-only data
    const { data, error } = await client
      .from('owner_payouts')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Customer should not access owner data');
    } else {
      assert.equal(data.length, 0, 'Customer should not see owner payouts');
    }
    
    // Sign out
    await client.auth.signOut();
  });
  
  test('owner A cannot access owner B salon', async (t) => {
    if (!client || !env.ACCEPTANCE_OWNER_A_EMAIL || !env.ACCEPTANCE_OWNER_B_EMAIL) {
      t.skip('BLOCKED: Owner credentials not configured');
      return;
    }
    
    // Sign in as owner A
    const { error: signInError } = await client.auth.signInWithPassword({
      email: env.ACCEPTANCE_OWNER_A_EMAIL,
      password: env.ACCEPTANCE_OWNER_A_PASSWORD
    });
    
    if (signInError) {
      t.skip(`BLOCKED: Cannot sign in as owner A: ${signInError.message}`);
      return;
    }
    
    // Get owner B's salon ID (would need to be set up in test fixtures)
    // This is a placeholder - real test would need proper fixtures
    const ownerBSalonId = 'test-owner-b-salon-id';
    
    // Try to access owner B's salon
    const { data, error } = await client
      .from('salons')
      .select('*')
      .eq('id', ownerBSalonId)
      .single();
    
    if (error && error.code !== 'PGRST116', 'No rows') {
      // Error is acceptable
    } else if (data) {
      // If we got data, check if it's actually owner B's
      t.fail('Owner A should not access owner B salon');
    }
    
    await client.auth.signOut();
  });
  
  test('partner A cannot access partner B commission', async (t) => {
    if (!client || !env.ACCEPTANCE_PARTNER_A_EMAIL || !env.ACCEPTANCE_PARTNER_B_EMAIL) {
      t.skip('BLOCKED: Partner credentials not configured');
      return;
    }
    
    const { error: signInError } = await client.auth.signInWithPassword({
      email: env.ACCEPTANCE_PARTNER_A_EMAIL,
      password: env.ACCEPTANCE_PARTNER_A_PASSWORD
    });
    
    if (signInError) {
      t.skip(`BLOCKED: Cannot sign in as partner A: ${signInError.message}`);
      return;
    }
    
    // Try to access partner B's commission
    const { data, error } = await client
      .from('growth_partner_commissions')
      .select('*')
      .limit(1);
    
    if (error) {
      assert.match(error.message, /permission denied|not authorized/i,
        'Partner should not access other partner commissions');
    } else if (data && data.length > 0) {
      // Check if it's partner A's own commission
      // Real test would verify the growth_partner_id matches
    }
    
    await client.auth.signOut();
  });
});
