// Gemini cover reading (plan §8.1). Logic lives in handler.ts so it can be tested with stubs.
import { requireUser } from '../_shared/auth.ts';

import { type Admin, handle } from './handler.ts';

Deno.serve((req) =>
  handle(req, {
    requireUser: async (r) => {
      const { uid, admin } = await requireUser(r);
      const a: Admin = {
        countUsageSince: async (user, since) => {
          const { count } = await admin
            .from('ai_usage')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user)
            .gte('created_at', since);
          return count ?? 0;
        },
        recordUsage: async (user, ok) => {
          await admin.from('ai_usage').insert({ user_id: user, ok });
        },
        download: async (path) => {
          const { data, error } = await admin.storage.from('covers').download(path);
          return error || !data ? null : new Uint8Array(await data.arrayBuffer());
        },
      };
      return { uid, admin: a };
    },
    fetch,
    env: (k) => Deno.env.get(k),
    now: () => new Date(),
  }),
);
