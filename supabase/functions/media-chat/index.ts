// AI overview & chat about one movie or show. Logic lives in handler.ts so it can be tested with stubs.
import { requireUser } from '../_shared/auth.ts';

import { type ChatStore, handle, type TitleContext } from './handler.ts';

Deno.serve((req) =>
  handle(req, {
    requireUser: async (r) => {
      const { uid, userClient: db, admin } = await requireUser(r);
      const store: ChatStore = {
        // Everything below reads and writes as the user, so RLS keeps it to their own rows.
        context: async (itemId) => {
          const { data: item } = await db
            .from('items')
            .select('id, kind, title, title_native, status')
            .eq('id', itemId)
            .maybeSingle();
          if (!item || (item.kind !== 'movie' && item.kind !== 'show')) return null;
          if (item.kind === 'movie') {
            const { data: m } = await db
              .from('movies')
              .select('release_year, runtime_min, genres, overview')
              .eq('item_id', itemId)
              .maybeSingle();
            return {
              kind: 'movie',
              title: item.title,
              titleNative: item.title_native,
              year: m?.release_year ?? null,
              overview: m?.overview ?? null,
              genres: m?.genres ?? [],
              runtimeMin: m?.runtime_min ?? null,
              network: null,
              tmdbStatus: null,
              seasons: null,
              watchedUpTo: null,
              status: item.status,
            } satisfies TitleContext;
          }
          const [{ data: s }, { data: last }] = await Promise.all([
            db
              .from('shows')
              .select('first_air_year, network, tmdb_status, number_of_seasons, overview')
              .eq('item_id', itemId)
              .maybeSingle(),
            db
              .from('episode_watches')
              .select('season, episode')
              .eq('item_id', itemId)
              .gt('season', 0) // specials don't mark how far into the story you are
              .order('season', { ascending: false })
              .order('episode', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          return {
            kind: 'show',
            title: item.title,
            titleNative: item.title_native,
            year: s?.first_air_year ?? null,
            overview: s?.overview ?? null,
            genres: [],
            runtimeMin: null,
            network: s?.network ?? null,
            tmdbStatus: s?.tmdb_status ?? null,
            seasons: s?.number_of_seasons ?? null,
            watchedUpTo: last ? { season: last.season, episode: last.episode } : null,
            status: item.status,
          } satisfies TitleContext;
        },
        history: async (itemId, limit) => {
          const { data, error } = await db
            .from('media_chat_messages')
            .select('role, content')
            .eq('item_id', itemId)
            .order('created_at', { ascending: false })
            .limit(limit);
          if (error) throw error;
          return (data ?? []).reverse();
        },
        save: async (itemId, turns, language) => {
          // Explicit, increasing timestamps keep the question before its answer.
          const base = Date.now();
          const { error } = await db.from('media_chat_messages').insert(
            turns.map((t, i) => ({
              item_id: itemId,
              role: t.role,
              content: t.content,
              language,
              created_at: new Date(base + i).toISOString(),
            })),
          );
          if (error) throw error;
        },
        // Usage is service-role only (no RLS policies on ai_usage).
        countUsageSince: async (user, since) => {
          const { count } = await admin
            .from('ai_usage')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user)
            .eq('kind', 'chat')
            .gte('created_at', since);
          return count ?? 0;
        },
        recordUsage: async (user, ok) => {
          await admin.from('ai_usage').insert({ user_id: user, ok, kind: 'chat' });
        },
      };
      return { uid, store };
    },
    fetch,
    env: (k) => Deno.env.get(k),
    now: () => new Date(),
  }),
);
