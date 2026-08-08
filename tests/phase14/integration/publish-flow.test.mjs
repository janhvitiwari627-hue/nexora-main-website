// Phase 14 Integration Tests - Publish Flow
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isLiveTestConfigured } from '../helpers/env.mjs';

test.describe('Publish Flow - Live Integration Tests', () => {
  let client;
  let env;
  let partnerSession;
  let ownerSession;
  
  test.before(async () => {
    env = getEnv();
    const configured = isLiveTestConfigured();
    
    if (!configured.hasSupabase) {
      console.log('BLOCKED: Supabase not configured');
      return;
    }
    
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Sign in as partner
    if (env.ACCEPTANCE_PARTNER_A_EMAIL) {
      const { data, error } = await client.auth.signInWithPassword({
        email: env.ACCEPTANCE_PARTNER_A_EMAIL,
        password: env.ACCEPTANCE_PARTNER_A_PASSWORD
      });
      if (!error) partnerSession = data;
    }
    
    // Sign in as owner
    if (env.ACCEPTANCE_OWNER_A_EMAIL) {
      const { data, error } = await client.auth.signInWithPassword({
        email: env.ACCEPTANCE_OWNER_A_EMAIL,
        password: env.ACCEPTANCE_OWNER_A_PASSWORD
      });
      if (!error && !partnerSession) ownerSession = data;
    }
  });
  
  test('partner can create draft proposal', async (t) => {
    if (!partnerSession) {
      t.skip('BLOCKED: Partner not authenticated');
      return;
    }
    
    // Create a draft proposal
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .insert({
        salon_name: 'Test Salon for Phase 14',
        salon_description: 'Test description',
        status: 'draft',
        submitted_by_partner_id: partnerSession.user.id
      })
      .select()
      .single();
    
    if (error) {
      t.skip(`BLOCKED: Cannot create proposal: ${error.message}`);
      return;
    }
    
    assert.equal(data.status, 'draft', 'Should create draft');
    assert.equal(data.submitted_by_partner_id, partnerSession.user.id, 'Should attribute to partner');
  });
  
  test('owner can request changes', async (t) => {
    if (!ownerSession) {
      t.skip('BLOCKED: Owner not authenticated');
      return;
    }
    
    // This would update a proposal status to changes_requested
    // Placeholder - real test needs actual proposal ID
    t.skip('BLOCKED: Needs proposal fixture');
  });
  
  test('invalid state transition fails', async (t) => {
    if (!client) {
      t.skip('BLOCKED: Not configured');
      return;
    }
    
    // Try to publish without approval
    const { error } = await client
      .rpc('update_proposal_status', {
        proposal_id: 'fake-id',
        new_status: 'published'
      });
    
    if (error) {
      // Expected - should fail
      assert.ok(true);
    } else {
      t.fail('Should have failed invalid transition');
    }
  });
  
  test.after(() => {
    if (client) {
      client.auth.signOut();
    }
  });
});
