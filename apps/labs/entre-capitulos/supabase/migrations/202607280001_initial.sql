create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'book_status') then
    create type public.book_status as enum (
      'want_to_read',
      'reading',
      'completed',
      'abandoned'
    );
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  initials text not null check (char_length(trim(initials)) between 1 and 3),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('google_books', 'manual')),
  source_id text,
  title text not null check (char_length(trim(title)) > 0),
  subtitle text not null default '',
  authors text[] not null check (cardinality(authors) > 0),
  publisher text not null default '',
  published_date text not null default '',
  page_count integer check (page_count is null or page_count > 0),
  language text not null default '',
  description text not null default '',
  categories text[] not null default '{}',
  isbn_10 text not null default '',
  isbn_13 text not null default '',
  cover_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

create unique index if not exists books_owner_source_id_unique
  on public.books (owner_id, source, source_id)
  where source_id is not null;

create unique index if not exists books_owner_isbn13_unique
  on public.books (owner_id, isbn_13)
  where isbn_13 <> '';

create table if not exists public.library_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null,
  book_id uuid not null,
  status public.book_status not null default 'want_to_read',
  categories text[] not null default '{}',
  started_at date,
  ended_at date,
  current_page integer check (current_page is null or current_page >= 0),
  review text not null default '',
  story_summary text not null default '',
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_entry_dates_valid
    check (started_at is null or ended_at is null or ended_at >= started_at),
  constraint library_entry_profile_owner_fk
    foreign key (owner_id, profile_id)
    references public.profiles(owner_id, id)
    on delete restrict,
  constraint library_entry_book_owner_fk
    foreign key (owner_id, book_id)
    references public.books(owner_id, id)
    on delete restrict,
  unique (owner_id, id),
  unique (owner_id, profile_id, book_id)
);

create table if not exists public.rating_scores (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null,
  criterion text not null check (
    criterion in (
      'writing_quality',
      'engagement',
      'theme',
      'characters',
      'plot',
      'pacing',
      'originality',
      'world_building',
      'emotional_impact',
      'ending'
    )
  ),
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rating_entry_owner_fk
    foreign key (owner_id, entry_id)
    references public.library_entries(owner_id, id)
    on delete cascade,
  primary key (entry_id, criterion)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

drop trigger if exists library_entries_set_updated_at on public.library_entries;
create trigger library_entries_set_updated_at
before update on public.library_entries
for each row execute function public.set_updated_at();

drop trigger if exists rating_scores_set_updated_at on public.rating_scores;
create trigger rating_scores_set_updated_at
before update on public.rating_scores
for each row execute function public.set_updated_at();

create or replace view public.library_entries_with_score
with (security_invoker = true)
as
select
  library_entries.*,
  round(avg(rating_scores.score)::numeric, 1) as average_rating,
  count(rating_scores.score)::integer as rated_criteria_count
from public.library_entries
left join public.rating_scores
  on rating_scores.entry_id = library_entries.id
group by library_entries.id;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.library_entries enable row level security;
alter table public.rating_scores enable row level security;

drop policy if exists "profiles_household_access" on public.profiles;
create policy "profiles_household_access"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "books_household_access" on public.books;
create policy "books_household_access"
on public.books
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "library_entries_household_access" on public.library_entries;
create policy "library_entries_household_access"
on public.library_entries
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "rating_scores_household_access" on public.rating_scores;
create policy "rating_scores_household_access"
on public.rating_scores
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

revoke all on public.profiles from anon;
revoke all on public.books from anon;
revoke all on public.library_entries from anon;
revoke all on public.rating_scores from anon;
revoke all on public.library_entries_with_score from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.books to authenticated;
grant select, insert, update, delete on public.library_entries to authenticated;
grant select, insert, update, delete on public.rating_scores to authenticated;
grant select on public.library_entries_with_score to authenticated;

create index if not exists library_entries_profile_status_idx
  on public.library_entries (profile_id, status);

create index if not exists library_entries_updated_idx
  on public.library_entries (owner_id, updated_at desc);

create index if not exists rating_scores_entry_idx
  on public.rating_scores (entry_id);
