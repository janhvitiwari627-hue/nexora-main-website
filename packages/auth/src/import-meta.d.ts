/**
 * Minimal Vite environment augmentation used by the shared source package.
 * Keeping this local lets the same TypeScript compile under Vite and Next
 * without suppressing diagnostics or importing Vite as an auth dependency.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
