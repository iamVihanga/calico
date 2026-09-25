// Colombo is UTC+05:30 all year (no DST).
const OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Today's window in Colombo as UTC ISO strings: [since, resetsAt). Used for the daily AI limit. */
export function colomboDayWindow(now: Date = new Date()): { since: string; resetsAt: string } {
  const local = new Date(now.getTime() + OFFSET_MS);
  const midnightLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const since = new Date(midnightLocal - OFFSET_MS);
  const resetsAt = new Date(since.getTime() + 24 * 60 * 60 * 1000);
  return { since: since.toISOString(), resetsAt: resetsAt.toISOString() };
}
