/**
 * Homepage Phase 1 · Section 10 — Jaipur city eligibility.
 * (Renumbered from "Section 08" per locked MEMORY.md order — PHASE1_SECTION10.md.)
 *
 * Top 5 Jaipur listing must only include salons whose REAL `city` field is
 * Jaipur. An area/locality named Jaipur is NOT city verification, and a
 * missing city is never blindly included. Normalization is limited to
 * trim/casing/whitespace — no fuzzy guessing.
 */

/** Trim + lowercase + collapse whitespace. Empty/missing → "". */
export function normalizeCityName(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** True only when the real city field is Jaipur (case/whitespace tolerant). */
export function isJaipurCity(raw: string | null | undefined): boolean {
  return normalizeCityName(raw) === "jaipur";
}
