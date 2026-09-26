// Account deletion (plan §8.5). Logic in handler.ts.
import type { SupabaseClient } from '@supabase/supabase-js';

import { requireUser } from '../_shared/auth.ts';

import { handle } from './handler.ts';

/** Walk `covers/{prefix}` (folders are listed as entries without an id). */
async function listAll(admin: SupabaseClient, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from('covers').list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const e of data) {
      const path = `${prefix}/${e.name}`;
      if (e.id) out.push(path);
      else out.push(...(await listAll(admin, path)));
    }
    if (data.length < 1000) return out;
  }
}

Deno.serve((req) =>
  handle(req, {
    requireUser: async (r) => {
      const { uid, admin } = await requireUser(r);
      return {
        uid,
        admin: {
          listCovers: (u) => listAll(admin, u),
          removeCovers: async (paths) => {
            const { error } = await admin.storage.from('covers').remove(paths);
            if (error) throw error;
          },
          deleteUser: async (u) => {
            const { error } = await admin.auth.admin.deleteUser(u);
            if (error) throw error;
          },
        },
      };
    },
  }),
);
