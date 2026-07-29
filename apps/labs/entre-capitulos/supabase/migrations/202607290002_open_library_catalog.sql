-- Open Library catalog, editorial curation and neutral retailer destinations.
-- This migration is additive: the Amazon tables/functions remain available
-- during the rollback window and legacy book sources remain valid.

alter table public.books
  drop constraint if exists books_source_check;

alter table public.books
  add constraint books_source_check
  check (source in ('google_books', 'manual', 'amazon', 'open_library'));

create table if not exists public.catalog_works (
  work_key text primary key check (
    work_key ~ '^(OL[0-9]+W|manual:[a-z0-9][a-z0-9:_-]{2,95})$'
  ),
  title text not null check (char_length(trim(title)) between 1 and 500),
  authors text[] not null default '{}',
  first_published_year integer check (
    first_published_year is null
    or first_published_year between 1000 and 2200
  ),
  description text not null default '',
  subjects text[] not null default '{}',
  languages text[] not null default '{}',
  edition_count integer not null default 0,
  cover_url text not null default '' check (
    cover_url = '' or cover_url ~ '^https://'
  ),
  source text not null check (source in ('open_library', 'manual')),
  primary_edition_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_works
  add column if not exists edition_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_works_edition_count_valid'
      and conrelid = 'public.catalog_works'::regclass
  ) then
    alter table public.catalog_works
      add constraint catalog_works_edition_count_valid
      check (edition_count >= 0);
  end if;
end
$$;

create table if not exists public.catalog_work_sources (
  id uuid primary key default gen_random_uuid(),
  work_key text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  source text not null check (
    source in (
      'open_library',
      'legacy_amazon',
      'google_books',
      'manual_alias'
    )
  ),
  source_key text not null check (
    char_length(trim(source_key)) between 1 and 300
  ),
  alias_title text not null default '',
  alias_authors text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_key)
);

create table if not exists public.catalog_editions (
  edition_key text primary key check (
    edition_key ~ '^(OL[0-9]+M|manual:[a-z0-9][a-z0-9:_-]{2,110})$'
  ),
  work_key text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  source text not null check (source in ('open_library', 'manual')),
  isbn_10 text not null default '' check (
    isbn_10 = '' or isbn_10 ~ '^[0-9]{9}[0-9X]$'
  ),
  isbn_13 text not null default '' check (
    isbn_13 = '' or isbn_13 ~ '^[0-9]{13}$'
  ),
  publisher text not null default '',
  published_date text not null default '',
  language text not null default '',
  format text not null default '',
  page_count integer check (page_count is null or page_count > 0),
  cover_url text not null default '' check (
    cover_url = '' or cover_url ~ '^https://'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_key, edition_key)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_works_primary_edition_fk'
      and conrelid = 'public.catalog_works'::regclass
  ) then
    alter table public.catalog_works
      add constraint catalog_works_primary_edition_fk
      foreign key (work_key, primary_edition_key)
      references public.catalog_editions(work_key, edition_key)
      on delete set null (primary_edition_key);
  end if;
end
$$;

create unique index if not exists catalog_editions_isbn10_unique
  on public.catalog_editions (isbn_10)
  where isbn_10 <> '';

create unique index if not exists catalog_editions_isbn13_unique
  on public.catalog_editions (isbn_13)
  where isbn_13 <> '';

create index if not exists catalog_editions_work_idx
  on public.catalog_editions (work_key, published_date desc, edition_key);

create table if not exists public.catalog_identity_rules (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('merge', 'separate')),
  work_key_a text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  work_key_b text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  edition_key text
    references public.catalog_editions(edition_key)
    on update cascade
    on delete cascade,
  method text not null default 'manual' check (
    method in ('manual', 'same_work_key', 'shared_isbn', 'exact', 'fuzzy')
  ),
  confidence numeric(4, 3) not null default 1 check (
    confidence between 0 and 1
  ),
  note text not null default '',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (work_key_a <> work_key_b)
);

drop index if exists public.catalog_identity_rules_pair_unique;

create unique index if not exists catalog_identity_rules_active_pair_unique
  on public.catalog_identity_rules (
    least(work_key_a, work_key_b),
    greatest(work_key_a, work_key_b)
  )
  where active and edition_key is null;

create unique index if not exists catalog_identity_rules_active_edition_unique
  on public.catalog_identity_rules (
    least(work_key_a, work_key_b),
    greatest(work_key_a, work_key_b),
    edition_key
  )
  where active and edition_key is not null;

create or replace function public.resolve_catalog_identity_rule_conflicts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not new.active then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(
    'entre-capitulos-catalog-identity-' ||
    least(new.work_key_a, new.work_key_b) || ':' ||
    greatest(new.work_key_a, new.work_key_b) || ':' ||
    coalesce(new.edition_key, '')
  ));

  update public.catalog_identity_rules
  set active = false
  where id <> new.id
    and active
    and least(work_key_a, work_key_b) =
      least(new.work_key_a, new.work_key_b)
    and greatest(work_key_a, work_key_b) =
      greatest(new.work_key_a, new.work_key_b)
    and (
      (new.edition_key is null and edition_key is null)
      or edition_key = new.edition_key
    );

  return new;
end;
$$;

drop trigger if exists catalog_identity_rules_resolve_conflicts
  on public.catalog_identity_rules;
create trigger catalog_identity_rules_resolve_conflicts
before insert or update of action, work_key_a, work_key_b, edition_key, active
on public.catalog_identity_rules
for each row execute function public.resolve_catalog_identity_rule_conflicts();

create table if not exists public.catalog_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '',
  badge text not null default '',
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null
    references public.catalog_collections(id)
    on delete cascade,
  work_key text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  edition_key text,
  editorial_text text not null default '',
  badge text not null default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_collection_items_edition_fk
    foreign key (work_key, edition_key)
    references public.catalog_editions(work_key, edition_key)
    on delete set null (edition_key),
  unique (collection_id, work_key)
);

create index if not exists catalog_collection_items_order_idx
  on public.catalog_collection_items (
    collection_id,
    sort_order,
    created_at
  );

create table if not exists public.catalog_retailer_links (
  id uuid primary key default gen_random_uuid(),
  work_key text not null
    references public.catalog_works(work_key)
    on update cascade
    on delete cascade,
  edition_key text,
  retailer text not null check (
    retailer in ('amazon_br', 'estante_virtual', 'mercado_livre')
  ),
  url text not null check (
    char_length(url) between 10 and 2000
    and (
      (
        retailer = 'amazon_br'
        and url ~* '^https://(www\.)?amazon\.com\.br/'
      )
      or (
        retailer = 'estante_virtual'
        and url ~* '^https://(www\.)?estantevirtual\.com\.br/'
      )
      or (
        retailer = 'mercado_livre'
        and url ~* '^https://((www|lista)\.)?mercadolivre\.com\.br/'
      )
    )
  ),
  kind text not null default 'direct' check (kind = 'direct'),
  affiliate boolean not null default false,
  label text not null default 'Ver esta edição na loja',
  legacy_asin text check (
    legacy_asin is null or legacy_asin ~ '^[A-Z0-9]{10}$'
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_retailer_links_edition_fk
    foreign key (work_key, edition_key)
    references public.catalog_editions(work_key, edition_key)
    on update cascade
    on delete cascade,
  unique (retailer, url)
);

create unique index if not exists catalog_retailer_links_edition_unique
  on public.catalog_retailer_links (retailer, edition_key)
  where edition_key is not null and active;

create index if not exists catalog_retailer_links_work_idx
  on public.catalog_retailer_links (work_key, retailer)
  where active;

create index if not exists catalog_retailer_links_legacy_asin_idx
  on public.catalog_retailer_links (legacy_asin)
  where legacy_asin is not null and active;

create table if not exists public.book_catalog_cache (
  cache_key text primary key check (
    char_length(cache_key) between 1 and 128
  ),
  operation text not null check (
    operation in ('search', 'collection', 'work', 'resolve')
  ),
  request_descriptor jsonb not null check (
    jsonb_typeof(request_descriptor) = 'object'
  ),
  response_payload jsonb not null check (
    jsonb_typeof(response_payload) = 'object'
  ),
  fetched_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > fetched_at),
  stale_until timestamptz not null check (stale_until > expires_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_catalog_cache_expiry_idx
  on public.book_catalog_cache (expires_at);

create index if not exists book_catalog_cache_stale_idx
  on public.book_catalog_cache (stale_until);

create table if not exists public.book_catalog_client_rate_limits (
  client_key text not null check (client_key ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (client_key, window_start)
);

create or replace function public.consume_book_catalog_client_quota(
  p_client_key text,
  p_limit integer default 60,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window timestamptz;
  v_count integer := 0;
  v_retry integer;
begin
  if p_client_key !~ '^[a-f0-9]{64}$' then
    raise exception 'client key must be a SHA-256 hex digest';
  end if;

  if p_limit < 1 or p_limit > 1000 then
    raise exception 'client limit must be between 1 and 1000';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'window must be between 1 and 3600 seconds';
  end if;

  perform pg_advisory_xact_lock(
    hashtext('entre-capitulos-book-catalog-client-' || p_client_key)
  );

  v_window := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  select request_count
    into v_count
    from public.book_catalog_client_rate_limits
    where client_key = p_client_key and window_start = v_window;

  if coalesce(v_count, 0) >= p_limit then
    v_retry := greatest(
      1,
      ceil(extract(epoch from (
        (v_window + make_interval(secs => p_window_seconds)) - v_now
      )))::integer
    );
    return jsonb_build_object(
      'allowed', false,
      'reason', 'client',
      'retryAfterSeconds', v_retry
    );
  end if;

  insert into public.book_catalog_client_rate_limits (
    client_key,
    window_start,
    request_count,
    expires_at
  )
  values (
    p_client_key,
    v_window,
    1,
    v_window + make_interval(secs => p_window_seconds * 2)
  )
  on conflict (client_key, window_start)
  do update set
    request_count =
      public.book_catalog_client_rate_limits.request_count + 1,
    expires_at = excluded.expires_at;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.purge_expired_book_catalog_cache()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cache_deleted integer := 0;
  v_limits_deleted integer := 0;
begin
  delete from public.book_catalog_cache
  where stale_until <= now();
  get diagnostics v_cache_deleted = row_count;

  delete from public.book_catalog_client_rate_limits
  where expires_at <= now();
  get diagnostics v_limits_deleted = row_count;

  return jsonb_build_object(
    'cacheRowsDeleted', v_cache_deleted,
    'clientRowsDeleted', v_limits_deleted
  );
end;
$$;

create or replace function public.invalidate_book_catalog_cache()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (
    auth.role() = 'service_role'
    and tg_table_name in (
      'catalog_works',
      'catalog_work_sources',
      'catalog_editions'
    )
  ) then
    return null;
  end if;

  delete from public.book_catalog_cache;
  return null;
end;
$$;

do $$
declare
  v_table text;
  v_trigger text;
begin
  foreach v_table in array array[
    'catalog_works',
    'catalog_work_sources',
    'catalog_editions',
    'catalog_identity_rules',
    'catalog_collections',
    'catalog_collection_items',
    'catalog_retailer_links'
  ]
  loop
    v_trigger := v_table || '_invalidate_book_catalog_cache';
    execute format('drop trigger if exists %I on public.%I', v_trigger, v_table);
    execute format(
      'create trigger %I after insert or update or delete on public.%I ' ||
      'for each statement execute function public.invalidate_book_catalog_cache()',
      v_trigger,
      v_table
    );
  end loop;
end
$$;

do $$
declare
  v_table text;
  v_trigger text;
begin
  foreach v_table in array array[
    'catalog_works',
    'catalog_work_sources',
    'catalog_editions',
    'catalog_identity_rules',
    'catalog_collections',
    'catalog_collection_items',
    'catalog_retailer_links',
    'book_catalog_cache'
  ]
  loop
    v_trigger := v_table || '_set_updated_at';
    execute format('drop trigger if exists %I on public.%I', v_trigger, v_table);
    execute format(
      'create trigger %I before update on public.%I ' ||
      'for each row execute function public.set_updated_at()',
      v_trigger,
      v_table
    );
  end loop;
end
$$;

alter table public.catalog_works enable row level security;
alter table public.catalog_work_sources enable row level security;
alter table public.catalog_editions enable row level security;
alter table public.catalog_identity_rules enable row level security;
alter table public.catalog_collections enable row level security;
alter table public.catalog_collection_items enable row level security;
alter table public.catalog_retailer_links enable row level security;
alter table public.book_catalog_cache enable row level security;
alter table public.book_catalog_client_rate_limits enable row level security;

do $$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'catalog_works',
    'catalog_work_sources',
    'catalog_editions',
    'catalog_identity_rules',
    'catalog_collections',
    'catalog_collection_items',
    'catalog_retailer_links'
  ]
  loop
    v_policy := v_table || '_household_manage';
    execute format('drop policy if exists %I on public.%I', v_policy, v_table);
    execute format(
      'create policy %I on public.%I for all to authenticated ' ||
      'using (true) with check (true)',
      v_policy,
      v_table
    );
  end loop;
end
$$;

revoke all on public.catalog_works from anon;
revoke all on public.catalog_work_sources from anon;
revoke all on public.catalog_editions from anon;
revoke all on public.catalog_identity_rules from anon;
revoke all on public.catalog_collections from anon;
revoke all on public.catalog_collection_items from anon;
revoke all on public.catalog_retailer_links from anon;
revoke all on public.book_catalog_cache from anon, authenticated;
revoke all on public.book_catalog_client_rate_limits from anon, authenticated;

grant select, insert, update, delete
  on public.catalog_works,
     public.catalog_work_sources,
     public.catalog_editions,
     public.catalog_identity_rules,
     public.catalog_collections,
     public.catalog_collection_items,
     public.catalog_retailer_links
  to authenticated;

grant select, insert, update, delete
  on public.catalog_works,
     public.catalog_work_sources,
     public.catalog_editions,
     public.catalog_identity_rules,
     public.catalog_collections,
     public.catalog_collection_items,
     public.catalog_retailer_links,
     public.book_catalog_cache,
     public.book_catalog_client_rate_limits
  to service_role;

revoke all on function public.consume_book_catalog_client_quota(
  text,
  integer,
  integer
) from public, anon, authenticated;
revoke all on function public.purge_expired_book_catalog_cache()
  from public, anon, authenticated;
revoke all on function public.invalidate_book_catalog_cache()
  from public, anon, authenticated;
revoke all on function public.resolve_catalog_identity_rule_conflicts()
  from public, anon, authenticated;

grant execute on function public.consume_book_catalog_client_quota(
  text,
  integer,
  integer
) to service_role;
grant execute on function public.purge_expired_book_catalog_cache()
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'catalog-covers',
  'catalog-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog_covers_public_read" on storage.objects;
create policy "catalog_covers_public_read"
on storage.objects
for select
to public
using (bucket_id = 'catalog-covers');

drop policy if exists "catalog_covers_household_insert" on storage.objects;
create policy "catalog_covers_household_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalog-covers');

drop policy if exists "catalog_covers_household_update" on storage.objects;
create policy "catalog_covers_household_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalog-covers')
with check (bucket_id = 'catalog-covers');

drop policy if exists "catalog_covers_household_delete" on storage.objects;
create policy "catalog_covers_household_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'catalog-covers');

alter table public.books
  add column if not exists catalog_work_key text,
  add column if not exists catalog_edition_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_catalog_work_fk'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_catalog_work_fk
      foreign key (catalog_work_key)
      references public.catalog_works(work_key)
      on update cascade
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_catalog_edition_fk'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_catalog_edition_fk
      foreign key (catalog_work_key, catalog_edition_key)
      references public.catalog_editions(work_key, edition_key)
      on delete set null (catalog_edition_key);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_catalog_edition_requires_work'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_catalog_edition_requires_work
      check (catalog_edition_key is null or catalog_work_key is not null);
  end if;
end
$$;

create or replace function public.clear_deleted_work_from_books()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.books
  set
    catalog_edition_key = null,
    catalog_work_key = null
  where catalog_work_key = old.work_key;
  return old;
end;
$$;

drop trigger if exists catalog_works_clear_book_references
  on public.catalog_works;
create trigger catalog_works_clear_book_references
before delete on public.catalog_works
for each row execute function public.clear_deleted_work_from_books();

revoke all on function public.clear_deleted_work_from_books()
  from public, anon, authenticated;

create index if not exists books_catalog_work_idx
  on public.books (owner_id, catalog_work_key)
  where catalog_work_key is not null;

-- Canonical works enriched with Open Library work identifiers and covers.
insert into public.catalog_works (
  work_key,
  title,
  authors,
  first_published_year,
  description,
  subjects,
  languages,
  edition_count,
  cover_url,
  source,
  primary_edition_key
) values
  (
    'OL24141556W',
    'Torto Arado',
    array['Itamar Vieira Junior'],
    2019,
    'Bibiana e Belonísia crescem no sertão da Bahia, em uma família marcada pela terra, pela memória e pela resistência.',
    array['Literatura brasileira', 'Romance', 'Famílias', 'Irmãs'],
    array['pt'],
    5,
    'https://covers.openlibrary.org/b/id/12369648-L.jpg',
    'open_library',
    null
  ),
  (
    'OL1002120W',
    'A hora da estrela',
    array['Clarice Lispector'],
    1977,
    'Um romance breve e contundente sobre Macabéa, linguagem e invisibilidade.',
    array['Literatura brasileira', 'Clássicos', 'Ficção psicológica'],
    array['pt'],
    32,
    'https://covers.openlibrary.org/b/id/650866-L.jpg',
    'open_library',
    null
  ),
  (
    'OL27420W',
    'Ensaio sobre a cegueira',
    array['José Saramago'],
    1995,
    'Uma cegueira branca se espalha de forma fulminante e expõe escolhas individuais e as estruturas de uma sociedade.',
    array['Literatura portuguesa', 'Ficção', 'Epidemias', 'Cegueira'],
    array['pt'],
    40,
    'https://covers.openlibrary.org/b/id/10482411-L.jpg',
    'open_library',
    null
  ),
  (
    'OL27963555W',
    'O avesso da pele',
    array['Jeferson Tenório'],
    2020,
    'Um filho recompõe a história do pai e encara as marcas deixadas pela violência e pelo racismo.',
    array['Literatura brasileira', 'Romance contemporâneo', 'Racismo'],
    array['pt'],
    1,
    'https://covers.openlibrary.org/b/id/12769862-L.jpg',
    'open_library',
    null
  )
on conflict (work_key) do update
set
  title = excluded.title,
  authors = excluded.authors,
  first_published_year = excluded.first_published_year,
  description = excluded.description,
  subjects = excluded.subjects,
  languages = excluded.languages,
  edition_count = excluded.edition_count,
  cover_url = excluded.cover_url,
  source = excluded.source,
  updated_at = now();

insert into public.catalog_work_sources (
  work_key,
  source,
  source_key,
  alias_title,
  alias_authors
) values
  (
    'OL24141556W',
    'open_library',
    'OL24141556W',
    'Torto Arado',
    array['Itamar Vieira Junior']
  ),
  (
    'OL24141556W',
    'legacy_amazon',
    '6580309318',
    'Torto Arado',
    array['Itamar Vieira Junior']
  ),
  (
    'OL24141556W',
    'legacy_amazon',
    '6556927198',
    'Torto Arado',
    array['Itamar Vieira Junior']
  ),
  (
    'OL1002120W',
    'open_library',
    'OL1002120W',
    'A hora da estrela',
    array['Clarice Lispector']
  ),
  (
    'OL1002120W',
    'legacy_amazon',
    '6555320354',
    'A hora da estrela',
    array['Clarice Lispector']
  ),
  (
    'OL27420W',
    'open_library',
    'OL27420W',
    'Ensaio sobre a cegueira',
    array['José Saramago']
  ),
  (
    'OL27420W',
    'legacy_amazon',
    '8535930531',
    'Ensaio sobre a cegueira',
    array['José Saramago']
  ),
  (
    'OL27963555W',
    'open_library',
    'OL27963555W',
    'O avesso da pele',
    array['Jeferson Tenório']
  ),
  (
    'OL27963555W',
    'legacy_amazon',
    '8535933395',
    'O avesso da pele',
    array['Jeferson Tenório']
  )
on conflict (source, source_key) do update
set
  work_key = excluded.work_key,
  alias_title = excluded.alias_title,
  alias_authors = excluded.alias_authors,
  updated_at = now();

insert into public.catalog_editions (
  edition_key,
  work_key,
  source,
  isbn_10,
  isbn_13,
  publisher,
  published_date,
  language,
  format,
  page_count,
  cover_url
) values
  (
    'OL35663926M',
    'OL24141556W',
    'open_library',
    '6580309318',
    '9786580309313',
    'Todavia',
    '2019',
    'pt',
    'paperback',
    264,
    'https://covers.openlibrary.org/b/id/12369648-L.jpg'
  ),
  (
    'manual:isbn:9786556927190',
    'OL24141556W',
    'manual',
    '6556927198',
    '9786556927190',
    'Todavia',
    '2024',
    'pt',
    'hardcover',
    null,
    'https://covers.openlibrary.org/b/id/12369648-L.jpg'
  ),
  (
    'OL35693081M',
    'OL1002120W',
    'open_library',
    '6555320354',
    '9786555320350',
    'Rocco',
    '2020',
    'pt',
    'paperback',
    88,
    'https://covers.openlibrary.org/b/id/13348102-L.jpg'
  ),
  (
    'manual:isbn:9788535930535',
    'OL27420W',
    'manual',
    '8535930531',
    '9788535930535',
    'Companhia das Letras',
    '2017',
    'pt',
    'paperback',
    312,
    'https://covers.openlibrary.org/b/id/10482411-L.jpg'
  ),
  (
    'OL38222370M',
    'OL27963555W',
    'open_library',
    '8535933395',
    '9788535933390',
    'Companhia das Letras',
    '2020',
    'pt',
    'paperback',
    192,
    'https://covers.openlibrary.org/b/id/12769862-L.jpg'
  )
on conflict (edition_key) do update
set
  work_key = excluded.work_key,
  source = excluded.source,
  isbn_10 = excluded.isbn_10,
  isbn_13 = excluded.isbn_13,
  publisher = excluded.publisher,
  published_date = excluded.published_date,
  language = excluded.language,
  format = excluded.format,
  page_count = excluded.page_count,
  cover_url = excluded.cover_url,
  updated_at = now();

update public.catalog_works
set primary_edition_key = case work_key
  when 'OL24141556W' then 'OL35663926M'
  when 'OL1002120W' then 'OL35693081M'
  when 'OL27420W' then 'manual:isbn:9788535930535'
  when 'OL27963555W' then 'OL38222370M'
end
where work_key in (
  'OL24141556W',
  'OL1002120W',
  'OL27420W',
  'OL27963555W'
);

insert into public.catalog_collections (
  slug,
  title,
  description,
  badge,
  featured,
  published,
  sort_order
) values (
  'em-destaque',
  'Entre Capítulos indica',
  'Uma seleção editorial para descobrir a próxima leitura.',
  'Curadoria da casa',
  true,
  true,
  10
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  badge = excluded.badge,
  featured = excluded.featured,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.catalog_collection_items (
  collection_id,
  work_key,
  edition_key,
  editorial_text,
  badge,
  featured,
  sort_order
)
select
  collection.id,
  item.work_key,
  item.edition_key,
  item.editorial_text,
  item.badge,
  item.featured,
  item.sort_order
from public.catalog_collections as collection
cross join (
  values
    (
      'OL24141556W',
      'manual:isbn:9786556927190',
      'Terra, memória e resistência em uma narrativa brasileira essencial.',
      'Destaque',
      true,
      10
    ),
    (
      'OL1002120W',
      'OL35693081M',
      'Um clássico breve, singular e inesquecível.',
      'Clássico',
      false,
      20
    ),
    (
      'OL27420W',
      'manual:isbn:9788535930535',
      'Uma parábola incômoda sobre humanidade e sobrevivência.',
      'Nobel',
      false,
      30
    ),
    (
      'OL27963555W',
      'OL38222370M',
      'Uma voz potente da literatura brasileira contemporânea.',
      'Contemporâneo',
      false,
      40
    )
) as item (
  work_key,
  edition_key,
  editorial_text,
  badge,
  featured,
  sort_order
)
where collection.slug = 'em-destaque'
on conflict (collection_id, work_key) do update
set
  edition_key = excluded.edition_key,
  editorial_text = excluded.editorial_text,
  badge = excluded.badge,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  updated_at = now();

-- These four SiteStripe URLs are intentionally preserved byte-for-byte from
-- 202607290001_amazon_editorial_seed.sql.
insert into public.catalog_retailer_links (
  work_key,
  edition_key,
  retailer,
  url,
  kind,
  affiliate,
  label,
  legacy_asin,
  active
) values
  (
    'OL24141556W',
    'manual:isbn:9786556927190',
    'amazon_br',
    'https://www.amazon.com.br/Torto-arado-Itamar-Vieira-Junior/dp/6556927198?&linkCode=ll2&tag=entrecapitu04-20&linkId=46ba8e2caeaa429f238ceb6624dd8111&ref_=as_li_ss_tl',
    'direct',
    true,
    'Ver esta edição na Amazon',
    '6556927198',
    true
  ),
  (
    'OL1002120W',
    'OL35693081M',
    'amazon_br',
    'https://www.amazon.com.br/dp/6555320354?&linkCode=ll2&tag=entrecapitu04-20&linkId=d885554379d966ba9e5e36d4a6761d9b&ref_=as_li_ss_tl',
    'direct',
    true,
    'Ver esta edição na Amazon',
    '6555320354',
    true
  ),
  (
    'OL27420W',
    'manual:isbn:9788535930535',
    'amazon_br',
    'https://www.amazon.com.br/dp/8535930531?&linkCode=ll2&tag=entrecapitu04-20&linkId=80150af7ad4ede5796f3a3a12b13078a&ref_=as_li_ss_tl',
    'direct',
    true,
    'Ver esta edição na Amazon',
    '8535930531',
    true
  ),
  (
    'OL27963555W',
    'OL38222370M',
    'amazon_br',
    'https://www.amazon.com.br/dp/8535933395?&linkCode=ll2&tag=entrecapitu04-20&linkId=c1770889a6a9d2e99b5cbfeb888eb752&ref_=as_li_ss_tl',
    'direct',
    true,
    'Ver esta edição na Amazon',
    '8535933395',
    true
  )
on conflict (retailer, url) do update
set
  work_key = excluded.work_key,
  edition_key = excluded.edition_key,
  kind = excluded.kind,
  affiliate = excluded.affiliate,
  label = excluded.label,
  legacy_asin = excluded.legacy_asin,
  active = excluded.active,
  updated_at = now();

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'entre-capitulos-book-catalog-cache-purge'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'entre-capitulos-book-catalog-cache-purge',
    '*/30 * * * *',
    'select public.purge_expired_book_catalog_cache();'
  );
end
$$;
