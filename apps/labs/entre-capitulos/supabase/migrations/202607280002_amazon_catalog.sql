-- Amazon.com.br catalog integration.
-- This schema intentionally stores no price history. Catalog cache rows are
-- overwritten by cache_key and their volatile fields expire independently.

alter table public.books
  drop constraint if exists books_source_check;

alter table public.books
  add constraint books_source_check
  check (source in ('google_books', 'manual', 'amazon'));

create table if not exists public.amazon_book_editions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null,
  asin text not null check (asin ~ '^[A-Z0-9]{10}$'),
  parent_asin text check (
    parent_asin is null or parent_asin ~ '^[A-Z0-9]{10}$'
  ),
  format text not null default 'other' check (
    format in ('kindle', 'paperback', 'hardcover', 'audiobook', 'other')
  ),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amazon_book_editions_book_owner_fk
    foreign key (owner_id, book_id)
    references public.books(owner_id, id)
    on delete cascade,
  unique (owner_id, book_id, asin)
);

create unique index if not exists amazon_book_editions_one_primary_idx
  on public.amazon_book_editions (owner_id, book_id)
  where is_primary;

create index if not exists amazon_book_editions_asin_idx
  on public.amazon_book_editions (owner_id, asin);

create table if not exists public.amazon_editorial_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '',
  search_index text not null default 'Books' check (
    search_index in ('Books', 'KindleStore')
  ),
  category text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.amazon_editorial_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null
    references public.amazon_editorial_collections(id)
    on delete cascade,
  asin text not null check (asin ~ '^[A-Z0-9]{10}$'),
  parent_asin text check (
    parent_asin is null or parent_asin ~ '^[A-Z0-9]{10}$'
  ),
  affiliate_url text not null check (
    affiliate_url ~* '^https://(www\.)?amazon\.com\.br/'
    and affiliate_url ~* '[?&]tag=[^&#]+'
  ),
  title text not null check (char_length(trim(title)) > 0),
  authors text[] not null default '{}',
  publisher text not null default '',
  publication_date text not null default '',
  format text not null default 'other' check (
    format in ('kindle', 'paperback', 'hardcover', 'audiobook', 'other')
  ),
  category text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, asin)
);

alter table public.amazon_editorial_items
  drop column if exists image_url;

create index if not exists amazon_editorial_items_active_order_idx
  on public.amazon_editorial_items (active, sort_order, created_at);

create index if not exists amazon_editorial_items_asin_idx
  on public.amazon_editorial_items (asin);

create table if not exists public.amazon_catalog_cache (
  cache_key text primary key check (
    char_length(cache_key) between 1 and 128
  ),
  operation text not null check (
    operation in ('search', 'items', 'variations')
  ),
  metadata_payload jsonb,
  metadata_fetched_at timestamptz,
  metadata_expires_at timestamptz,
  commerce_payload jsonb,
  commerce_fetched_at timestamptz,
  commerce_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amazon_catalog_cache_metadata_valid check (
    (
      metadata_payload is null
      and metadata_fetched_at is null
      and metadata_expires_at is null
    )
    or (
      metadata_payload is not null
      and jsonb_typeof(metadata_payload) = 'array'
      and metadata_fetched_at is not null
      and metadata_expires_at > metadata_fetched_at
      and metadata_expires_at <= metadata_fetched_at + interval '24 hours'
    )
  ),
  constraint amazon_catalog_cache_commerce_valid check (
    (
      commerce_payload is null
      and commerce_fetched_at is null
      and commerce_expires_at is null
    )
    or (
      commerce_payload is not null
      and jsonb_typeof(commerce_payload) = 'object'
      and commerce_fetched_at is not null
      and commerce_expires_at > commerce_fetched_at
      and commerce_expires_at <= commerce_fetched_at + interval '1 hour'
    )
  )
);

create index if not exists amazon_catalog_cache_metadata_expiry_idx
  on public.amazon_catalog_cache (metadata_expires_at)
  where metadata_expires_at is not null;

create index if not exists amazon_catalog_cache_commerce_expiry_idx
  on public.amazon_catalog_cache (commerce_expires_at)
  where commerce_expires_at is not null;

create table if not exists public.amazon_api_quota_counters (
  bucket_kind text not null check (bucket_kind in ('second', 'day')),
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (bucket_kind, bucket_start)
);

create table if not exists public.amazon_client_rate_limits (
  client_key text not null check (client_key ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (client_key, window_start)
);

create or replace function public.acquire_amazon_api_quota(
  p_daily_limit integer default 8640
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_second timestamptz;
  v_day timestamptz;
  v_second_count integer := 0;
  v_day_count integer := 0;
  v_retry integer;
begin
  if p_daily_limit < 1 or p_daily_limit > 8640 then
    raise exception 'daily limit must be between 1 and 8640';
  end if;

  perform pg_advisory_xact_lock(hashtext('entre-capitulos-amazon-api-quota'));

  v_second := date_trunc('second', v_now);
  v_day := date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC';

  select request_count
    into v_second_count
    from public.amazon_api_quota_counters
    where bucket_kind = 'second' and bucket_start = v_second;

  if coalesce(v_second_count, 0) >= 1 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'per_second',
      'retryAfterSeconds', 1
    );
  end if;

  select request_count
    into v_day_count
    from public.amazon_api_quota_counters
    where bucket_kind = 'day' and bucket_start = v_day;

  if coalesce(v_day_count, 0) >= p_daily_limit then
    v_retry := greatest(
      1,
      ceil(extract(epoch from ((v_day + interval '1 day') - v_now)))::integer
    );
    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily',
      'retryAfterSeconds', v_retry
    );
  end if;

  insert into public.amazon_api_quota_counters (
    bucket_kind,
    bucket_start,
    request_count,
    expires_at
  )
  values ('second', v_second, 1, v_second + interval '2 seconds')
  on conflict (bucket_kind, bucket_start)
  do update set
    request_count = public.amazon_api_quota_counters.request_count + 1,
    expires_at = excluded.expires_at;

  insert into public.amazon_api_quota_counters (
    bucket_kind,
    bucket_start,
    request_count,
    expires_at
  )
  values ('day', v_day, 1, v_day + interval '2 days')
  on conflict (bucket_kind, bucket_start)
  do update set
    request_count = public.amazon_api_quota_counters.request_count + 1,
    expires_at = excluded.expires_at;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.consume_amazon_client_quota(
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
    hashtext('entre-capitulos-amazon-client-' || p_client_key)
  );

  v_window := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  select request_count
    into v_count
    from public.amazon_client_rate_limits
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

  insert into public.amazon_client_rate_limits (
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
    request_count = public.amazon_client_rate_limits.request_count + 1,
    expires_at = excluded.expires_at;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.purge_expired_amazon_catalog_cache()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_metadata_cleared integer := 0;
  v_commerce_cleared integer := 0;
  v_cache_deleted integer := 0;
  v_quota_deleted integer := 0;
  v_clients_deleted integer := 0;
begin
  update public.amazon_catalog_cache
  set
    metadata_payload = null,
    metadata_fetched_at = null,
    metadata_expires_at = null,
    updated_at = now()
  where metadata_expires_at is not null
    and metadata_expires_at <= now();
  get diagnostics v_metadata_cleared = row_count;

  update public.amazon_catalog_cache
  set
    commerce_payload = null,
    commerce_fetched_at = null,
    commerce_expires_at = null,
    updated_at = now()
  where commerce_expires_at is not null
    and commerce_expires_at <= now();
  get diagnostics v_commerce_cleared = row_count;

  delete from public.amazon_catalog_cache
  where metadata_payload is null and commerce_payload is null;
  get diagnostics v_cache_deleted = row_count;

  delete from public.amazon_api_quota_counters
  where expires_at <= now();
  get diagnostics v_quota_deleted = row_count;

  delete from public.amazon_client_rate_limits
  where expires_at <= now();
  get diagnostics v_clients_deleted = row_count;

  return jsonb_build_object(
    'metadataCleared', v_metadata_cleared,
    'commerceCleared', v_commerce_cleared,
    'cacheRowsDeleted', v_cache_deleted,
    'quotaRowsDeleted', v_quota_deleted,
    'clientRowsDeleted', v_clients_deleted
  );
end;
$$;

drop trigger if exists amazon_book_editions_set_updated_at
  on public.amazon_book_editions;
create trigger amazon_book_editions_set_updated_at
before update on public.amazon_book_editions
for each row execute function public.set_updated_at();

drop trigger if exists amazon_editorial_collections_set_updated_at
  on public.amazon_editorial_collections;
create trigger amazon_editorial_collections_set_updated_at
before update on public.amazon_editorial_collections
for each row execute function public.set_updated_at();

drop trigger if exists amazon_editorial_items_set_updated_at
  on public.amazon_editorial_items;
create trigger amazon_editorial_items_set_updated_at
before update on public.amazon_editorial_items
for each row execute function public.set_updated_at();

drop trigger if exists amazon_catalog_cache_set_updated_at
  on public.amazon_catalog_cache;
create trigger amazon_catalog_cache_set_updated_at
before update on public.amazon_catalog_cache
for each row execute function public.set_updated_at();

alter table public.amazon_book_editions enable row level security;
alter table public.amazon_editorial_collections enable row level security;
alter table public.amazon_editorial_items enable row level security;
alter table public.amazon_catalog_cache enable row level security;
alter table public.amazon_api_quota_counters enable row level security;
alter table public.amazon_client_rate_limits enable row level security;

drop policy if exists "amazon_book_editions_household_access"
  on public.amazon_book_editions;
create policy "amazon_book_editions_household_access"
on public.amazon_book_editions
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

revoke all on public.amazon_book_editions from anon;
revoke all on public.amazon_editorial_collections from anon, authenticated;
revoke all on public.amazon_editorial_items from anon, authenticated;
revoke all on public.amazon_catalog_cache from anon, authenticated;
revoke all on public.amazon_api_quota_counters from anon, authenticated;
revoke all on public.amazon_client_rate_limits from anon, authenticated;

grant select, insert, update, delete
  on public.amazon_book_editions
  to authenticated;

grant select, insert, update, delete
  on public.amazon_editorial_collections
  to service_role;
grant select, insert, update, delete
  on public.amazon_editorial_items
  to service_role;
grant select, insert, update, delete
  on public.amazon_catalog_cache
  to service_role;
grant select, insert, update, delete
  on public.amazon_api_quota_counters
  to service_role;
grant select, insert, update, delete
  on public.amazon_client_rate_limits
  to service_role;

revoke all on function public.acquire_amazon_api_quota(integer)
  from public, anon, authenticated;
revoke all on function public.consume_amazon_client_quota(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.purge_expired_amazon_catalog_cache()
  from public, anon, authenticated;

grant execute on function public.acquire_amazon_api_quota(integer)
  to service_role;
grant execute on function public.consume_amazon_client_quota(text, integer, integer)
  to service_role;
grant execute on function public.purge_expired_amazon_catalog_cache()
  to service_role;

-- The request path also purges opportunistically, while pg_cron guarantees
-- cleanup even when the storefront has no traffic or changes mode.
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'entre-capitulos-amazon-cache-purge'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'entre-capitulos-amazon-cache-purge',
    '*/15 * * * *',
    'select public.purge_expired_amazon_catalog_cache();'
  );
end;
$$;
