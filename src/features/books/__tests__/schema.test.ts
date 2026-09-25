import { reviewSchema, statusOptions } from '../schema';

const base = {
  titleNative: '',
  title: 'Madol Doova',
  authorNative: '',
  author: '',
  language: 'Sinhala',
  pages: '214',
  format: 'physical' as const,
  source: 'library' as const,
  party: 'Colombo Public Library',
  dueDays: 30 as const,
  priority: 'soon' as const,
  price: '',
  status: 'reading' as const,
};

describe('review form', () => {
  it('accepts a title in either script', () => {
    expect(reviewSchema.safeParse(base).success).toBe(true);
    expect(reviewSchema.safeParse({ ...base, title: '', titleNative: 'මඩොල් දූව' }).success).toBe(true);
  });

  it('needs some title', () => {
    const r = reviewSchema.safeParse({ ...base, title: ' ', titleNative: '' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['title']);
  });

  it('rejects non-numeric pages', () => {
    expect(reviewSchema.safeParse({ ...base, pages: '21a' }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, pages: '' }).success).toBe(true);
  });

  it("offers +30 as a due choice (the user's library lends for 30 days)", () => {
    expect(reviewSchema.safeParse({ ...base, dueDays: 30 }).success).toBe(true);
    expect(reviewSchema.safeParse({ ...base, dueDays: 10 }).success).toBe(false);
  });

  it('status chips depend on the source', () => {
    expect(statusOptions('bought')).toEqual(['to_read', 'reading', 'read']);
    expect(statusOptions('library')).toEqual(['to_read', 'reading']);
    expect(statusOptions('wishlist')).toEqual([]);
  });
});
