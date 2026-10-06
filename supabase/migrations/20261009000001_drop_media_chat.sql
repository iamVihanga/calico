-- Ask Pinki (the per-title Gemini chat) is removed: its conversations, its AI-usage rows and its place in
-- Export go. Covers still count in ai_usage (kind 'cover').

drop table public.media_chat_messages;

delete from public.ai_usage where kind = 'chat';
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind = 'cover');

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
    'up_next', coalesce((select jsonb_agg(to_jsonb(t) order by t.position) from up_next t where t.user_id = auth.uid()), '[]')
  );
$$;
