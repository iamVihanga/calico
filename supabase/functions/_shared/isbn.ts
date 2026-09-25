// Pure ISBN helpers. Shared by the edge functions (Deno) and the app (import via `@shared/isbn.ts`).

/** Keep digits and a trailing X (ISBN-10 check digit). */
export function cleanIsbn(raw: string): string {
  const s = raw.toUpperCase().replace(/[^0-9X]/g, '');
  return s.replace(/X(?!$)/g, '');
}

export function isValidIsbn10(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const c = s[i] as string;
    sum += (c === 'X' ? 10 : Number(c)) * (10 - i);
  }
  return sum % 11 === 0;
}

export function isbn13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

export function isValidIsbn13(s: string): boolean {
  if (!/^97[89]\d{10}$/.test(s)) return false;
  return isbn13CheckDigit(s.slice(0, 12)) === Number(s[12]);
}

export function isbn10to13(s: string): string {
  const core = '978' + s.slice(0, 9);
  return core + isbn13CheckDigit(core);
}

/** Normalise any ISBN-10/13 (with dashes/spaces) to a valid ISBN-13, or null. */
export function toIsbn13(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = cleanIsbn(raw);
  if (s.length === 13) return isValidIsbn13(s) ? s : null;
  if (s.length === 10) return isValidIsbn10(s) ? isbn10to13(s) : null;
  return null;
}

/** Barcode scanner guard: only book EANs (978/979) with a valid checksum. */
export const isBookEan = (ean: string) => isValidIsbn13(ean);
