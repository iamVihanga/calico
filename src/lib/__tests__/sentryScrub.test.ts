import { scrubBreadcrumb, scrubEvent, scrubUrl } from '../sentryScrub';

describe('sentry scrubbing', () => {
  it('drops query strings and fragments from URLs', () => {
    expect(scrubUrl('https://x.supabase.co/rest/v1/items?title=ilike.*Gamperaliya*')).toBe(
      'https://x.supabase.co/rest/v1/items',
    );
    expect(scrubUrl('https://x.supabase.co/storage/v1/object/sign/covers/u/i/front.jpg?token=abc')).toBe(
      'https://x.supabase.co/storage/v1/object/sign/covers/u/i/front.jpg',
    );
    expect(scrubUrl('/book/42#notes')).toBe('/book/42');
    expect(scrubUrl('/search')).toBe('/search');
  });

  it('drops console breadcrumbs and strips URLs and params from the rest', () => {
    expect(scrubBreadcrumb({ category: 'console', message: 'Madol Doova' })).toBeNull();
    expect(
      scrubBreadcrumb({ category: 'fetch', data: { url: 'https://h/rest/v1/items?q=secret', status_code: 200 } }),
    ).toEqual({ category: 'fetch', data: { url: 'https://h/rest/v1/items', status_code: 200 } });
    expect(
      scrubBreadcrumb({
        category: 'navigation',
        data: { from: '/search?q=secret', to: '/book/1', params: { q: 's' } },
      }),
    ).toEqual({ category: 'navigation', data: { from: '/search', to: '/book/1' } });
  });

  it('keeps only the user id and the request path', () => {
    const out = scrubEvent({
      user: { id: 'uuid-1', email: 'reader@example.com', ip_address: '1.2.3.4' },
      request: { url: 'https://h/rest/v1/rpc/log_page?x=1', headers: { Authorization: 'Bearer t' }, data: '{}' },
      breadcrumbs: [{ category: 'console', message: 'note text' }, { category: 'touch' }],
    });
    expect(out.user).toEqual({ id: 'uuid-1' });
    expect(out.request).toEqual({ url: 'https://h/rest/v1/rpc/log_page' });
    expect(out.breadcrumbs).toEqual([{ category: 'touch' }]);
  });
});
