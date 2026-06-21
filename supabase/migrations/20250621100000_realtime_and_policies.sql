-- Enable Realtime for match snapshots
alter publication supabase_realtime add table public.matches;

-- Allow server-side event logging (service role bypasses RLS; policy for authenticated API paths)
create policy "Authenticated users can append match events"
  on public.match_events for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- Ratings writes via service role / own user
create policy "Service role can upsert ratings"
  on public.ratings for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update ratings"
  on public.ratings for update
  using (auth.role() = 'service_role');
