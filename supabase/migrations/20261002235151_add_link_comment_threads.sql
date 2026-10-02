create table public.link_comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  link_id uuid not null references public.links(id) on delete cascade,
  body text not null,
  author_kind text not null check (author_kind in ('owner', 'visitor')),
  source_hash text,
  created_at timestamptz not null default now(),
  constraint link_comments_body_words check (
    length(body) <= 10000
    and btrim(body) <> ''
    and array_length(regexp_split_to_array(btrim(body), '[[:space:]]+'), 1) <= 500
  )
);

create index link_comments_page_created_idx on public.link_comments(page_id, created_at);
create index link_comments_source_created_idx on public.link_comments(page_id, source_hash, created_at);

alter table public.link_comments enable row level security;
revoke all on public.link_comments from public, anon, authenticated;
grant select, insert, delete on public.link_comments to authenticated;

create policy "Owners read comments" on public.link_comments
  for select to authenticated
  using (exists (select 1 from public.pages p where p.id = page_id and p.user_id = (select auth.uid())));

create policy "Owners add comments" on public.link_comments
  for insert to authenticated
  with check (
    author_kind = 'owner' and source_hash is null
    and exists (select 1 from public.pages p where p.id = page_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.links l where l.id = link_id and l.page_id = link_comments.page_id)
  );

create policy "Owners remove comments" on public.link_comments
  for delete to authenticated
  using (exists (select 1 from public.pages p where p.id = page_id and p.user_id = (select auth.uid())));
