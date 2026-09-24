-- 0001_schema: tables, types, triggers (docs/build-plan.md §7.2)

-- Supabase keeps extensions out of `public`. pg_cron is not relocatable (it creates the `cron` schema).
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create type media_kind as enum ('book', 'movie', 'show');
create type item_status as enum (
  'wishlist', 'to_read', 'reading', 'read', 'abandoned',   -- books
  'watchlist', 'watching', 'watched', 'dropped'            -- movies and shows
);
create type book_format as enum ('physical', 'ebook', 'audiobook');
create type loan_direction as enum ('borrowed', 'lent');

create or replace function public.local_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Colombo')::date $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- Profiles -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  lead_script text not null default 'en' check (lead_script in ('en', 'si')),
  theme text not null default 'day' check (theme in ('day', 'night', 'system')),
  reminder_time time not null default '09:00',
  remind_3d boolean not null default true,
  remind_1d boolean not null default true,
  default_loan_days int not null default 14 check (default_loan_days between 1 and 90),
  default_library text,
  reading_goal int check (reading_goal between 1 and 1000),
  include_specials boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Items ----------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind media_kind not null,
  status item_status not null,
  title text not null check (length(title) between 1 and 300),       -- English / romanized display title
  title_native text check (length(title_native) <= 300),             -- native script (Sinhala, Tamil...)
  cover_path text,          -- Supabase Storage path for user photos: {uid}/{item_id}/front.jpg
  cover_url text,           -- external cover (Open Library / Google Books)
  poster_path text,         -- TMDB poster path
  backdrop_path text,       -- TMDB backdrop path
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text check (length(note) <= 2000),
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint status_matches_kind check (
    (kind = 'book'  and status in ('wishlist','to_read','reading','read','abandoned')) or
    (kind = 'movie' and status in ('watchlist','watched','dropped')) or
    (kind = 'show'  and status in ('watchlist','watching','watched','dropped'))
  )
);
create trigger items_updated before update on items for each row execute function set_updated_at();
create index items_user_kind_status on items (user_id, kind, status, updated_at desc);
create index items_title_trgm on items using gin (lower(title) extensions.gin_trgm_ops);
create index items_title_native_trgm on items using gin (title_native extensions.gin_trgm_ops);

-- Books ----------------------------------------------------------------
create table public.books (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  author text,
  author_native text,
  language text not null default 'English',
  isbn text check (isbn ~ '^(97[89])?\d{9}[\dX]$'),
  publisher text,
  published_year int check (published_year between 1400 and 2100),
  format book_format not null default 'physical',
  ownership text not null default 'owned' check (ownership in ('owned', 'library', 'friend', 'none')),
  progress_unit text not null default 'pages' check (progress_unit in ('pages', 'percent')),
  total_pages int check (total_pages > 0),
  current_page int not null default 0 check (current_page >= 0),
  wishlist_priority text check (wishlist_priority in ('someday', 'soon', 'must')),
  wishlist_price_lkr int check (wishlist_price_lkr >= 0),
  wishlist_where text,
  abandon_reason text,
  ai_extracted boolean not null default false,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  check (total_pages is null or current_page <= total_pages)
);
create index books_author_trgm on books using gin (lower(author) extensions.gin_trgm_ops);
create index books_author_native_trgm on books using gin (author_native extensions.gin_trgm_ops);
create index books_isbn on books (user_id, isbn);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  started_at date not null default local_today(),
  finished_at date,
  outcome text not null default 'reading' check (outcome in ('reading', 'read', 'abandoned', 'paused')),
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text,
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create unique index one_open_session on reading_sessions (item_id) where outcome = 'reading';

create table public.page_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  page int not null check (page >= 0),
  logged_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index page_logs_item_time on page_logs (item_id, logged_at desc);
create index page_logs_user_time on page_logs (user_id, logged_at);

-- Loans ----------------------------------------------------------------
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  direction loan_direction not null default 'borrowed',
  party text not null,                        -- library name, or friend's name
  borrowed_on date not null default local_today(),
  due_on date,                                -- nullable for friend loans without a date
  due_stamps date[] not null default '{}',    -- every due date ever set, for LoanSlip stamps
  returned_on date,
  renewal_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  check (due_on is null or due_on >= borrowed_on)
);
create trigger loans_updated before update on loans for each row execute function set_updated_at();
create unique index one_open_loan on loans (item_id) where returned_on is null;
create index loans_open_due on loans (user_id, due_on) where returned_on is null;

-- Movies ---------------------------------------------------------------
create table public.movies (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  tmdb_id int not null,
  release_year int,
  runtime_min int,
  genres text[] not null default '{}',
  overview text,
  tmdb_collection_id int,
  tmdb_collection_name text,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  unique (user_id, tmdb_id)
);

create table public.watch_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  watched_on date not null default local_today(),
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index watch_logs_item on watch_logs (item_id, watched_on desc);

-- Shows ----------------------------------------------------------------
create table public.shows (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  tmdb_id int not null,
  first_air_year int,
  network text,
  tmdb_status text,               -- 'Returning Series' | 'Ended' | 'Canceled' | 'In Production' ...
  number_of_seasons int,
  next_air_date date,
  next_season int,
  next_episode int,
  overview text,
  last_synced_at timestamptz,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  unique (user_id, tmdb_id)
);
create index shows_tmdb on shows (tmdb_id);

create table public.tmdb_episodes (       -- shared cache, no user data
  tmdb_show_id int not null,
  season int not null,
  episode int not null,
  name text,
  air_date date,
  still_path text,
  vote_average numeric(3,1),
  runtime_min int,
  fetched_at timestamptz not null default now(),
  primary key (tmdb_show_id, season, episode)
);

create table public.episode_watches (
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  season int not null,
  episode int not null,
  watched_at timestamptz not null default now(),
  primary key (item_id, season, episode),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);

-- Collections ----------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  description text check (length(description) <= 200),
  pinned boolean not null default false,
  sort_mode text not null default 'custom' check (sort_mode in ('custom', 'year', 'added')),
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create trigger collections_updated before update on collections for each row execute function set_updated_at();
create unique index collections_name_unique on collections (user_id, lower(name));

create table public.collection_items (
  collection_id uuid not null,
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  position text collate "C" not null,
  added_at timestamptz not null default now(),
  primary key (collection_id, item_id),
  foreign key (collection_id, user_id) references collections (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index collection_items_item on collection_items (item_id);

-- Up next --------------------------------------------------------------
create table public.up_next (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  position text collate "C" not null,       -- fractional-indexing key
  added_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index up_next_order on up_next (user_id, position);

-- AI usage (rate limiting) --------------------------------------------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  ok boolean not null
);
create index ai_usage_user_time on ai_usage (user_id, created_at desc);

-- Side effect: finished/dropped items leave the queue ------------------
create or replace function public.items_status_side_effects() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status
     and new.status in ('read', 'watched', 'dropped', 'abandoned') then
    delete from up_next where item_id = new.id;
  end if;
  return new;
end $$;
create trigger items_status_effects after update of status on items
  for each row execute function items_status_side_effects();
