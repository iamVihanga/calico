import { assertEquals } from '@std/assert';

import { type Deps, handle } from './handler.ts';

type Route = (url: string, init?: RequestInit) => Response | undefined;

function deps(route: Route): Deps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    requireUser: () => Promise.resolve({}),
    env: () => undefined,
    fetch: ((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      return Promise.resolve(route(url, init) ?? new Response('not found', { status: 404 }));
    }) as typeof fetch,
  };
}

const req = (isbn: string) => new Request('http://localhost/isbn-lookup', { method: 'POST', body: JSON.stringify({ isbn }) });

Deno.test('Open Library hit with author and cover', async () => {
  const d = deps((url) => {
    if (url.endsWith('/isbn/9780553393569.json'))
      return Response.json({
        title: 'Fire & Blood',
        number_of_pages: 736,
        publishers: ['Bantam'],
        publish_date: 'Nov 20, 2018',
        languages: [{ key: '/languages/eng' }],
        authors: [{ key: '/authors/OL234664A' }],
      });
    if (url.endsWith('/authors/OL234664A.json')) return Response.json({ name: 'George R. R. Martin' });
    if (url.startsWith('https://covers.openlibrary.org')) return new Response(null, { status: 200 });
  });
  const res = await handle(req('978-0-553-39356-9'), d);
  const body = await res.json();
  assertEquals(body.found, true);
  assertEquals(body.title, 'Fire & Blood');
  assertEquals(body.author, 'George R. R. Martin');
  assertEquals(body.pages, 736);
  assertEquals(body.year, 2018);
  assertEquals(body.language, 'English');
  assertEquals(body.source, 'openlibrary');
  assertEquals(body.coverUrl, 'https://covers.openlibrary.org/b/isbn/9780553393569-L.jpg?default=false');
});

Deno.test('falls back to Google Books and converts ISBN-10', async () => {
  const d = deps((url) => {
    if (url.includes('googleapis.com'))
      return Response.json({
        items: [{ volumeInfo: { title: 'Chinaman', authors: ['Shehan Karunatilaka'], pageCount: 416, language: 'en' } }],
      });
  });
  const res = await handle(req('0-00-000000-0'), d);
  const body = await res.json();
  assertEquals(body.isbn, '9780000000002');
  assertEquals(body.source, 'googlebooks');
  assertEquals(body.author, 'Shehan Karunatilaka');
  assertEquals(d.calls.some((c) => c.includes('q=isbn:9780000000002')), true);
});

Deno.test('no match anywhere → found: false', async () => {
  const res = await handle(req('9780000000002'), deps(() => undefined));
  const body = await res.json();
  assertEquals(body.found, false);
  assertEquals(body.isbn, '9780000000002');
});

Deno.test('invalid ISBN → 400', async () => {
  const res = await handle(req('9780000000003'), deps(() => undefined));
  assertEquals(res.status, 400);
});
