// Gemini cover-reading contract (plan §8.1). Shared by extract-book and the app's Review form.
import { z } from 'zod';

import { toIsbn13 } from './isbn.ts';

const nullableString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? null);
const nullableInt = z
  .number()
  .int()
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const CONFIDENCE_FIELDS = [
  'title_native',
  'title_romanized',
  'author_native',
  'author_romanized',
  'language',
  'isbn',
  'publisher',
  'published_year',
  'total_pages',
] as const;
export type ConfidenceField = (typeof CONFIDENCE_FIELDS)[number];

/** Below this a person should check the field (dotted underline in the form). */
export const LOW_CONFIDENCE = 0.6;

export const Extraction = z.object({
  script_on_cover: z.enum(['sinhala', 'latin', 'tamil', 'mixed']),
  title_native: nullableString,
  title_romanized: nullableString,
  author_native: nullableString,
  author_romanized: nullableString,
  language: z.enum(['Sinhala', 'English', 'Tamil', 'Other']),
  isbn: nullableString,
  publisher: nullableString,
  published_year: nullableInt,
  total_pages: nullableInt,
  confidence: z
    .object(Object.fromEntries(CONFIDENCE_FIELDS.map((f) => [f, z.number().min(0).max(1).optional()])))
    .partial(),
});
export type Extraction = z.infer<typeof Extraction>;

/** The same shape as JSON Schema for Gemini's `responseJsonSchema`. */
export const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    script_on_cover: { type: 'string', enum: ['sinhala', 'latin', 'tamil', 'mixed'] },
    title_native: { type: ['string', 'null'] },
    title_romanized: { type: ['string', 'null'] },
    author_native: { type: ['string', 'null'] },
    author_romanized: { type: ['string', 'null'] },
    language: { type: 'string', enum: ['Sinhala', 'English', 'Tamil', 'Other'] },
    isbn: { type: ['string', 'null'] },
    publisher: { type: ['string', 'null'] },
    published_year: { type: ['integer', 'null'] },
    total_pages: { type: ['integer', 'null'] },
    confidence: {
      type: 'object',
      properties: Object.fromEntries(CONFIDENCE_FIELDS.map((f) => [f, { type: 'number' }])),
    },
  },
  required: ['script_on_cover', 'title_romanized', 'language', 'confidence'],
} as const;

export type NormalizedExtraction = Omit<Extraction, 'confidence'> & { confidence: Record<ConfidenceField, number> };

const clean = (s: string | null) => {
  if (s === null) return null;
  const v = s.normalize('NFC').trim().replace(/\s+/g, ' ');
  return v.length ? v : null;
};

/**
 * Trim + NFC every string, keep the ISBN only if its checksum passes (as ISBN-13), clamp pages to
 * 1–5000, and zero the confidence of any field that ended up null.
 */
export function normalizeExtraction(e: Extraction): NormalizedExtraction {
  const pages = e.total_pages === null ? null : Math.max(1, Math.min(5000, e.total_pages));
  const out = {
    script_on_cover: e.script_on_cover,
    title_native: clean(e.title_native),
    title_romanized: clean(e.title_romanized),
    author_native: clean(e.author_native),
    author_romanized: clean(e.author_romanized),
    language: e.language,
    isbn: toIsbn13(e.isbn),
    publisher: clean(e.publisher),
    published_year: e.published_year,
    total_pages: pages,
  };
  const confidence = Object.fromEntries(
    CONFIDENCE_FIELDS.map((f) => {
      const value = out[f];
      const c = e.confidence[f] ?? 0;
      return [f, value === null || value === undefined ? 0 : Math.max(0, Math.min(1, c))];
    }),
  ) as Record<ConfidenceField, number>;
  return { ...out, confidence };
}

/** isbn-lookup response (plan §8.3). */
export type IsbnLookup = {
  found: boolean;
  isbn: string;
  title: string | null;
  author: string | null;
  pages: number | null;
  publisher: string | null;
  year: number | null;
  language: 'Sinhala' | 'English' | 'Tamil' | 'Other' | null;
  coverUrl: string | null;
  source: 'openlibrary' | 'googlebooks' | null;
};

/** extract-book error bodies. */
export type ExtractError =
  | { error: 'daily_limit'; limit: number; resetsAt: string }
  | { error: 'ai_unreadable' }
  | { error: 'ai_failed' }
  | { error: 'unauthorized' | 'bad_request' | 'bad_path' | 'image_missing' };
