// Phase 14 Environment Helper - Live test configuration
// Requires real Supabase credentials and test accounts
//
// VITE_ variables are accepted as fallback for NEXT_PUBLIC_ variables
// to support migration from Vite-based PWA configurations.

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ACCEPTANCE_BASE_URL',
  'ACCEPTANCE_CUSTOMER_A_EMAIL',
  'ACCEPTANCE_CUSTOMER_A_PASSWORD',
  'ACCEPTANCE_CUSTOMER_B_EMAIL',
  'ACCEPTANCE_CUSTOMER_B_PASSWORD',
  'ACCEPTANCE_OWNER_A_EMAIL',
  'ACCEPTANCE_OWNER_A_PASSWORD',
  'ACCEPTANCE_OWNER_B_EMAIL',
  'ACCEPTANCE_OWNER_B_PASSWORD',
  'ACCEPTANCE_PARTNER_A_EMAIL',
  'ACCEPTANCE_PARTNER_A_PASSWORD',
  'ACCEPTANCE_PARTNER_B_EMAIL',
  'ACCEPTANCE_PARTNER_B_PASSWORD',
];

// Resolve Supabase URL with VITE_ fallback
function resolveSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
}

// Resolve Supabase anon key with VITE_ and PUBLISHABLE_KEY fallbacks
function resolveSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    ?? process.env.VITE_SUPABASE_ANON_KEY 
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
    ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY 
    ?? '';
}

export function getEnv() {
  const env = {};
  for (const key of REQUIRED_VARS) {
    env[key] = process.env[key] || '';
  }
  // Add resolved Supabase values with fallback
  env.NEXT_PUBLIC_SUPABASE_URL = resolveSupabaseUrl();
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = resolveSupabaseAnonKey();
  return env;
}

export function isLiveTestConfigured() {
  const env = getEnv();
  const missing = REQUIRED_VARS.filter(k => !env[k]);
  return {
    configured: missing.length === 0,
    missing,
    hasSupabase: !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasDeployment: !!env.ACCEPTANCE_BASE_URL,
    hasTestAccounts: REQUIRED_VARS.filter(k => k.includes('EMAIL') || k.includes('PASSWORD')).every(k => env[k])
  };
}

export function assertLiveTestConfigured() {
  const status = isLiveTestConfigured();
  if (!status.configured) {
    const missingList = status.missing.join(', ');
    throw new Error(
      `LIVE ACCEPTANCE TESTS BLOCKED\n` +
      `Missing required environment variables: ${missingList}\n` +
      `Set these in .env.acceptance or CI environment to run live tests.\n` +
      `See .env.acceptance.example for required variables.`
    );
  }
}

export function createBlockedReport(testNames) {
  return {
    status: 'BLOCKED',
    reason: 'Live integration tests require Supabase credentials and test accounts',
    missingVars: isLiveTestConfigured().missing,
    tests: testNames.map(name => ({ name, status: 'BLOCKED', reason: 'Missing credentials' })),
    timestamp: new Date().toISOString()
  };
}

// Export resolved values for direct use in tests
export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey();
