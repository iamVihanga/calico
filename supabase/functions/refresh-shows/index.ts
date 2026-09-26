// Nightly show refresh (plan §8.4), called by pg_cron with x-cron-secret. Logic in handler.ts.
import { createClient } from '@supabase/supabase-js';

import { handle } from './handler.ts';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '',
);

Deno.serve((req) =>
  handle(req, {
    admin: {
      showsToRefresh: async (ended, staleBefore) => {
        const list = `(${ended.map((s) => `"${s}"`).join(',')})`;
        const { data, error } = await admin
          .from('shows')
          .select('tmdb_id')
          .or(`tmdb_status.is.null,tmdb_status.not.in.${list},last_synced_at.is.null,last_synced_at.lt.${staleBefore}`);
        if (error) throw error;
        return [...new Set(data.map((r) => r.tmdb_id as number))];
      },
      updateShows: async (tmdbId, patch) => {
        const { error } = await admin.from('shows').update(patch).eq('tmdb_id', tmdbId);
        if (error) throw error;
      },
      upsertEpisodes: async (rows) => {
        const { error } = await admin.from('tmdb_episodes').upsert(rows);
        if (error) throw error;
      },
    },
    fetch,
    env: (k) => Deno.env.get(k),
    now: () => new Date(),
  }),
);
