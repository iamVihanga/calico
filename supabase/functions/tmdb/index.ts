// TMDB proxy + shared episode cache (plan §8.2). Logic lives in handler.ts so it can be tested with stubs.
import { requireUser } from '../_shared/auth.ts';

import { type EpisodeCache, handle } from './handler.ts';

Deno.serve((req) =>
  handle(req, {
    requireUser: async (r) => {
      const { admin } = await requireUser(r);
      const cache: EpisodeCache = {
        upsert: async (rows) => {
          const { error } = await admin.from('tmdb_episodes').upsert(rows);
          if (error) throw error;
        },
        season: async (id, season) => {
          const { data, error } = await admin
            .from('tmdb_episodes')
            .select('*')
            .eq('tmdb_show_id', id)
            .eq('season', season)
            .order('episode');
          if (error) throw error;
          return data;
        },
        showStatus: async (id) => {
          const { data } = await admin.from('shows').select('tmdb_status').eq('tmdb_id', id).limit(1).maybeSingle();
          return data?.tmdb_status ?? null;
        },
      };
      return { cache };
    },
    fetch,
    env: (k) => Deno.env.get(k),
    now: () => new Date(),
  }),
);
