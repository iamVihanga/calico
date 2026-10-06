-- Settings → Theme: the colour family (Forest, Tortoiseshell). Night reading (`theme`) stays separate.
alter table public.profiles add column palette text not null default 'forest'
  check (palette in ('forest', 'tortoiseshell'));
