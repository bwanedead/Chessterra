-- Harden RLS and add optimistic-concurrency version column

alter table public.matches
  add column if not exists version integer not null default 0;

create or replace function public.snapshot_has_player(snapshot jsonb, player_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from jsonb_array_elements(snapshot -> 'players') as player
    where player ->> 'userId' = player_id
  );
$$;

-- Matches: drop permissive policies
drop policy if exists "Matches are viewable by everyone" on public.matches;
drop policy if exists "Authenticated users can create matches" on public.matches;
drop policy if exists "Match updates via service role" on public.matches;

-- Pending = invite-link model (UUID is the secret). Active+ = participants only.
create policy "Match read: invite or participant"
  on public.matches for select
  using (
    status = 'pending'
    or (
      auth.uid() is not null
      and public.snapshot_has_player(snapshot, auth.uid()::text)
    )
  );

-- Writes go through Next.js API + service role only (no direct client INSERT/UPDATE)

-- Match events: drop permissive policies
drop policy if exists "Match events viewable by everyone" on public.match_events;
drop policy if exists "Authenticated users can append match events" on public.match_events;

create policy "Match events: invite or participant read"
  on public.match_events for select
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (
          m.status = 'pending'
          or (
            auth.uid() is not null
            and public.snapshot_has_player(m.snapshot, auth.uid()::text)
          )
        )
    )
  );

-- Ratings: drop duplicate broad select; keep public leaderboard read + own read
drop policy if exists "Ratings are viewable by everyone" on public.ratings;

create policy "Ratings leaderboard read"
  on public.ratings for select
  using (true);
