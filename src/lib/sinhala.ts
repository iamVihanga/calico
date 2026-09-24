const SINHALA_CHAR = /[඀-෿]/;

/**
 * A Sinhala run starts and ends with a Sinhala character and may contain spaces and
 * joiners (ZWJ U+200D / ZWNJ U+200C) in between, so conjuncts like "වික්‍රම" and
 * multi-word titles like "මඩොල් දූව" stay in one run.
 */
const SINHALA_RUN = /[඀-෿](?:[඀-෿‌‍ ]*[඀-෿])?/g;

export function nfc(s: string): string {
  return s.normalize('NFC');
}

export function hasSinhala(s: string): boolean {
  return SINHALA_CHAR.test(s);
}

export type ScriptRun = { text: string; sinhala: boolean };

/** Split a string into alternating Latin / Sinhala runs. Joining the run texts gives back the input. */
export function splitScriptRuns(s: string): ScriptRun[] {
  const runs: ScriptRun[] = [];
  let last = 0;
  for (const m of s.matchAll(SINHALA_RUN)) {
    const start = m.index ?? 0;
    if (start > last) runs.push({ text: s.slice(last, start), sinhala: false });
    runs.push({ text: m[0], sinhala: true });
    last = start + m[0].length;
  }
  if (last < s.length) runs.push({ text: s.slice(last), sinhala: false });
  return runs;
}
