import { assertEquals } from '@std/assert';

import { HttpError } from '../_shared/http.ts';
import { type Deps, handle } from './handler.ts';

const UID = 'aaaaaaaa-0000-4000-8000-000000000001';

function deps(paths: string[]) {
  const removed: string[][] = [];
  const deleted: string[] = [];
  const d: Deps = {
    requireUser: () =>
      Promise.resolve({
        uid: UID,
        admin: {
          listCovers: () => Promise.resolve(paths),
          removeCovers: (p) => {
            removed.push(p);
            return Promise.resolve();
          },
          deleteUser: (u) => {
            deleted.push(u);
            return Promise.resolve();
          },
        },
      }),
  };
  return { d, removed, deleted };
}

const post = () => new Request('http://localhost/delete-account', { method: 'POST', body: '{}' });

Deno.test("removes only the user's covers, in batches, then the user", async () => {
  const mine = Array.from({ length: 150 }, (_, i) => `${UID}/item-${i}/front.jpg`);
  const { d, removed, deleted } = deps([...mine, 'someone-else/x/front.jpg']);
  const res = await handle(post(), d);
  assertEquals(res.status, 204);
  assertEquals(
    removed.map((b) => b.length),
    [100, 50],
  );
  assertEquals(
    removed.flat().every((p) => p.startsWith(`${UID}/`)),
    true,
  );
  assertEquals(deleted, [UID]);
});

Deno.test('no covers is fine', async () => {
  const { d, removed, deleted } = deps([]);
  assertEquals((await handle(post(), d)).status, 204);
  assertEquals(removed.length, 0);
  assertEquals(deleted, [UID]);
});

Deno.test('signed-out requests and GETs are refused', async () => {
  const { d, deleted } = deps([]);
  const noUser: Deps = { requireUser: () => Promise.reject(new HttpError(401, 'unauthorized')) };
  assertEquals((await handle(post(), noUser)).status, 401);
  assertEquals((await handle(new Request('http://localhost/delete-account'), d)).status, 405);
  assertEquals(deleted.length, 0);
});
