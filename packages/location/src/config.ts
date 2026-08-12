/** The only backend accepted by the shared location package. */
export const LOCATION_SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz";
export const LOCATION_SUPABASE_URL = `https://${LOCATION_SUPABASE_PROJECT_REF}.supabase.co`;

export function assertSharedLocationProject(client: unknown): void {
  const url = (client as { supabaseUrl?: unknown } | null)?.supabaseUrl;
  // supabase-js exposes supabaseUrl. Test doubles may omit it, in which case
  // repository calls remain protected by auth.getUser() and database RLS.
  if (typeof url !== "string") return;
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error("The location client has an invalid Supabase URL.");
  }
  if (hostname !== `${LOCATION_SUPABASE_PROJECT_REF}.supabase.co`) {
    throw new Error("The location client is not connected to the shared Nexora Supabase project.");
  }
}
