-- AI overview & chat per movie/show (media-chat edge function). Conversations are the user's own
-- rows: kept per title, cleared from the app, deleted with the item or the account (cascade).
create table public.media_chat_messages (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 8000),
  language text not null check (language in ('en', 'si')),
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index media_chat_item_time on media_chat_messages (item_id, created_at);

alter table public.media_chat_messages enable row level security;
create policy "own rows" on public.media_chat_messages for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Covers (30/day) and chat messages (50/day) are counted separately.
alter table public.ai_usage add column kind text not null default 'cover' check (kind in ('cover', 'chat'));
create index ai_usage_user_kind_time on ai_usage (user_id, kind, created_at desc);

-- Export (Settings → Export) includes the conversations.
create or replace function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from profiles p where p.id = auth.uid()),
    'items', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from items t where t.user_id = auth.uid()), '[]'),
    'books', coalesce((select jsonb_agg(to_jsonb(t)) from books t where t.user_id = auth.uid()), '[]'),
    'reading_sessions', coalesce((select jsonb_agg(to_jsonb(t)) from reading_sessions t where t.user_id = auth.uid()), '[]'),
    'page_logs', coalesce((select jsonb_agg(to_jsonb(t) order by t.logged_at) from page_logs t where t.user_id = auth.uid()), '[]'),
    'loans', coalesce((select jsonb_agg(to_jsonb(t)) from loans t where t.user_id = auth.uid()), '[]'),
    'movies', coalesce((select jsonb_agg(to_jsonb(t)) from movies t where t.user_id = auth.uid()), '[]'),
    'watch_logs', coalesce((select jsonb_agg(to_jsonb(t)) from watch_logs t where t.user_id = auth.uid()), '[]'),
    'shows', coalesce((select jsonb_agg(to_jsonb(t)) from shows t where t.user_id = auth.uid()), '[]'),
    'episode_watches', coalesce((select jsonb_agg(to_jsonb(t)) from episode_watches t where t.user_id = auth.uid()), '[]'),
    'collections', coalesce((select jsonb_agg(to_jsonb(t)) from collections t where t.user_id = auth.uid()), '[]'),
    'collection_items', coalesce((select jsonb_agg(to_jsonb(t)) from collection_items t where t.user_id = auth.uid()), '[]'),
    'up_next', coalesce((select jsonb_agg(to_jsonb(t) order by t.position) from up_next t where t.user_id = auth.uid()), '[]'),
    'chat_messages', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from media_chat_messages t where t.user_id = auth.uid()), '[]')
  );
$$;
