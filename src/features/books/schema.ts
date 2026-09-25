import { z } from 'zod';

import { copy } from '@/i18n/en';

export const SOURCES = ['bought', 'library', 'friend', 'wishlist'] as const;
export const DUE_CHOICES = [7, 14, 21, 30] as const;

/** Review form (manual add now; cover reading fills the same form in Phase 3). */
export const reviewSchema = z
  .object({
    titleNative: z.string().trim().max(300),
    title: z.string().trim().max(300),
    authorNative: z.string().trim().max(300),
    author: z.string().trim().max(300),
    language: z.string().min(1),
    pages: z
      .string()
      .trim()
      .regex(/^\d{0,5}$/, copy.review.badPages),
    format: z.enum(['physical', 'ebook', 'audiobook']),
    source: z.enum(SOURCES),
    party: z.string().trim().max(120),
    dueDays: z.union([z.literal(7), z.literal(14), z.literal(21), z.literal(30)]),
    priority: z.enum(['someday', 'soon', 'must']),
    price: z
      .string()
      .trim()
      .regex(/^\d{0,7}$/),
    status: z.enum(['to_read', 'reading', 'read']),
  })
  .refine((v) => v.title.length > 0 || v.titleNative.length > 0, { path: ['title'], message: copy.review.needTitle });

export type ReviewForm = z.infer<typeof reviewSchema>;

/** Status chips per source (prototype statusChips). */
export function statusOptions(source: ReviewForm['source']): ReviewForm['status'][] {
  if (source === 'wishlist') return [];
  return source === 'bought' ? ['to_read', 'reading', 'read'] : ['to_read', 'reading'];
}
