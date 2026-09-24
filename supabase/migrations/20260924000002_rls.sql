-- 0002_rls: row level security and the private covers bucket (docs/build-plan.md §7.3)

do $$
declare t text;
begin
  foreach t in array array['items','books','reading_sessions','page_logs','loans','movies',
                           'watch_logs','shows','episode_watches','collections','collection_items','up_next']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "own rows" on public.%I for all to authenticated
                     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy "own profile" on profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table tmdb_episodes enable row level security;
create policy "read cache" on tmdb_episodes for select to authenticated using (true);
-- no insert/update policies: only the service role (edge functions) writes

alter table ai_usage enable row level security;   -- no policies: service role only

-- Storage: private covers bucket, one folder per user
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', false, 3145728, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "covers read own" on storage.objects for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers update own" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
