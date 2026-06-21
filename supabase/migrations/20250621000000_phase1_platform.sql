-- Phase 1 platform schema for Endgame online play
-- Apply via Supabase CLI: supabase db push

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  pool_key jsonb not null,
  status text not null check (status in ('pending', 'active', 'completed', 'aborted')),
  snapshot jsonb not null,
  rated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_created_at_idx on public.matches (created_at desc);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select
  using (true);

create policy "Authenticated users can create matches"
  on public.matches for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "Match updates via service role"
  on public.matches for update
  using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Append-only event log
create table if not exists public.match_events (
  id bigserial primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists match_events_match_id_idx on public.match_events (match_id, id);

alter table public.match_events enable row level security;

create policy "Match events viewable by everyone"
  on public.match_events for select
  using (true);

-- Ratings per bucket
create table if not exists public.ratings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket_id text not null,
  rating numeric not null default 1500,
  rating_deviation numeric not null default 350,
  volatility numeric not null default 0.06,
  games_played integer not null default 0,
  provisional boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket_id)
);

create index if not exists ratings_bucket_rating_idx on public.ratings (bucket_id, rating desc);

alter table public.ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Users can read own ratings"
  on public.ratings for select
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Player')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
