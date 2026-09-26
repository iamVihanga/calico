import { generateKeyBetween } from 'fractional-indexing';

import { copy } from '@/i18n/en';
import { daysBetween, fmtDay, type LocalDate } from '@/lib/dates';

type Positioned = { position: string };

/** Key after the last item (plan §11.7). Lists are sorted with plain `<`/`>`, matching `collate "C"`. */
export const appendKey = (list: Positioned[]) => generateKeyBetween(list.at(-1)?.position ?? null, null);

export function keyForMove(list: Positioned[], from: number, to: number) {
  const rest = list.filter((_, i) => i !== from);
  return generateKeyBetween(to > 0 ? rest[to - 1]!.position : null, to < rest.length ? rest[to]!.position : null);
}

export const byPosition = (a: Positioned, b: Positioned) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

// Pick for me (plan §11.8) ---------------------------------------------------------------------------

export type QueueItem = {
  id: string;
  kind: 'book' | 'movie' | 'show';
  pagesLeft: number | null;
  runtimeMin: number | null;
  episodesLeft: number | null;
  progressPct: number | null;
  /** When it joined Up next (`yyyy-MM-dd`, Colombo). */
  addedAt: LocalDate;
};
export type OpenLoan = { direction: 'borrowed' | 'lent'; party: string; dueOn: LocalDate | null };

/** Rough effort in minutes: pages at 1.5 min, a movie's runtime, 45 min an episode. */
const effort = (x: QueueItem) =>
  x.kind === 'book'
    ? (x.pagesLeft ?? 300) * 1.5
    : x.kind === 'movie'
      ? (x.runtimeMin ?? 120)
      : (x.episodesLeft ?? 8) * 45;

/** Why Kiri picked it: a due date, the shortest thing, progress, or how long it has waited. */
export function pickReason(item: QueueItem, top10: QueueItem[], loan: OpenLoan | undefined, today: LocalDate): string {
  if (loan?.direction === 'borrowed' && loan.dueOn && daysBetween(today, loan.dueOn) <= 14) {
    return copy.pick.dueBack(loan.party, fmtDay(loan.dueOn));
  }
  // The least effort, and actually less than something else (a queue of equals has no "shortest").
  const e = effort(item);
  if (top10.every((o) => e <= effort(o)) && top10.some((o) => e < effort(o))) return copy.pick.shortest;
  if (item.progressPct && item.progressPct > 0) return copy.pick.alreadyIn(item.progressPct);
  const n = daysBetween(item.addedAt, today);
  return n <= 0 ? copy.pick.queuedToday : copy.pick.queuedAgo(n);
}

/** Uniform over the top 10 minus what was already picked this session (all of them again once exhausted). */
export function drawPick<T extends { id: string }>(top10: T[], picked: Set<string>, rand: () => number = Math.random) {
  const pool = top10.filter((x) => !picked.has(x.id));
  const from = pool.length ? pool : top10;
  return from[Math.floor(rand() * from.length)] ?? null;
}

export const PICK_POOL = 10;
