/**
 * Node/tsx runtime shim for Vite's `import.meta.env`.
 *
 * The app reads `import.meta.env.VITE_SUPABASE_*` at module scope (required
 * for Vite build-time replacement). Under `node --import tsx` import.meta.env
 * is undefined, which crashes those modules at import time. This loader hook
 * rewrites the *loaded source in memory* (never on disk) so tests can supply
 * the env through globalThis.__VITE_ENV__. Vite builds are unaffected.
 */
import { registerHooks } from 'node:module';

if (!globalThis.__VITE_ENV_SHIM_INSTALLED__) {
  globalThis.__VITE_ENV_SHIM_INSTALLED__ = true;
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (typeof result.source === 'string' && /\.tsx?($|\?)/.test(new URL(url).pathname)) {
        result.source = result.source.replaceAll('import.meta.env', '(globalThis.__VITE_ENV__ ??= {})');
      }
      return result;
    },
  });
}
