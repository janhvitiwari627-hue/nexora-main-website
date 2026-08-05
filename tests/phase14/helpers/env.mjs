// Phase 14 Environment Helper - Live test configuration
// Requires real Supabase credentials and test accounts

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

export function getEnv() {
  const env = {};
  for (const key of REQUIRED_VARS) {
    env[key] = process.env[key] || '';
  }
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
