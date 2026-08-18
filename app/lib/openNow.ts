/**
 * Homepage Phase 1 · Section 07 — Open Now time logic (pure, unit-testable).
 *
 * Truth rules: a salon is "Open Now" ONLY when a valid hours record exists
 * for the current IST weekday, the day is not marked closed, and the current
 * Asia/Kolkata minute falls inside the opens–closes window. Missing or
 * malformed values NEVER produce an open claim (they return null → excluded).
 *
 * Midnight-crossing windows (e.g. 8:00 PM – 2:00 AM) are evaluated safely:
 * when closes < opens the interval wraps past midnight, so late-night minutes
 * after midnight still count as inside the previous day's window.
 *
 * All functions are pure (no clock reads except the explicitly-passed
 * helpers) so the UI can refresh on a shared minute-level timer instead of
 * one timer per card.
 */

/** Documented Closing Soon threshold (spec allows 30–60 min). */
export const CLOSING_SOON_MINUTES = 45;

/** "HH:MM" → minutes since midnight; null when malformed/missing. */
export function parseClockToMinutes(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Is `nowMinutes` inside the opens–closes window?
 *  • true  — open right now
 *  • false — valid record, currently outside the window
 *  • null  — invalid/incomplete record (never claim open)
 * Midnight-crossing windows wrap safely.
 */
export function isOpenWindowAt(
  opens: string | null | undefined,
  closes: string | null | undefined,
  nowMinutes: number,
): boolean | null {
  const opensAt = parseClockToMinutes(opens);
  const closesAt = parseClockToMinutes(closes);
  if (opensAt == null || closesAt == null) return null;
  if (!Number.isFinite(nowMinutes)) return null;
  if (closesAt >= opensAt) return nowMinutes >= opensAt && nowMinutes <= closesAt;
  // Crosses midnight: inside if after opening OR before closing (next day).
  return nowMinutes >= opensAt || nowMinutes <= closesAt;
}

/**
 * Minutes until closing from `nowMinutes` (wrap-aware); null when the closing
 * time is missing/invalid. Used for the Closing Soon label — never for
 * inventing a closing time.
 */
export function minutesUntilClose(closes: string | null | undefined, nowMinutes: number): number | null {
  const closesAt = parseClockToMinutes(closes);
  if (closesAt == null || !Number.isFinite(nowMinutes)) return null;
  return closesAt >= nowMinutes ? closesAt - nowMinutes : closesAt + 1440 - nowMinutes;
}

/** Closing Soon = within the documented threshold (and still open). */
export function isClosingSoonAt(closes: string | null | undefined, nowMinutes: number): boolean {
  const remaining = minutesUntilClose(closes, nowMinutes);
  return remaining != null && remaining >= 0 && remaining <= CLOSING_SOON_MINUTES;
}

/**
 * "HH:MM" → 12-hour public label ("8:30 PM"); null when malformed.
 * Used for "Open until …" copy — only with real data.
 */
export function formatClock12(value: string | null | undefined): string | null {
  const minutes = parseClockToMinutes(value);
  if (minutes == null) return null;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

/** Current weekday (0=Sunday, Postgres day_of_week convention) in Asia/Kolkata. */
export function dayOfWeekIST(now: Date = new Date()): number {
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay();
}

/** Current minutes since midnight in Asia/Kolkata. */
export function minutesNowIST(now: Date = new Date()): number {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getHours() * 60 + ist.getMinutes();
}

export type OpenNowHoursLike = {
  opens_at?: string | null;
  closes_at?: string | null;
  is_closed?: boolean;
};

export type OpenNowVerdict =
  | { status: "open"; closesLabel: string | null; closingSoon: boolean }
  | { status: "closed" }
  | { status: "unknown" };

/**
 * Full Open Now verdict for one salon's hours record at `nowMinutes`.
 *  • open    — genuinely open right now (+ real closing label / Closing Soon)
 *  • closed  — valid record, not open (closed day or outside window)
 *  • unknown — missing/invalid record (never rendered as open)
 */
export function openNowVerdict(hours: OpenNowHoursLike | null | undefined, nowMinutes: number): OpenNowVerdict {
  if (!hours) return { status: "unknown" };
  if (hours.is_closed) return { status: "closed" };
  const open = isOpenWindowAt(hours.opens_at ?? null, hours.closes_at ?? null, nowMinutes);
  if (open === true) {
    return {
      status: "open",
      closesLabel: formatClock12(hours.closes_at ?? null),
      closingSoon: isClosingSoonAt(hours.closes_at ?? null, nowMinutes),
    };
  }
  if (open === false) return { status: "closed" };
  return { status: "unknown" };
}
