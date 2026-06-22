-- Atomically commit a match snapshot/version update with its audit events.
-- Postgres functions execute in the caller transaction, so the snapshot and event log
-- cannot diverge when this RPC succeeds or fails.

create or replace function public.commit_match_update(
  p_match_id uuid,
  p_expected_version integer,
  p_pool_key jsonb,
  p_status text,
  p_snapshot jsonb,
  p_rated boolean,
  p_events jsonb default '[]'::jsonb
)
returns table(ok boolean, reason text, version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_version integer;
begin
  if p_expected_version = 0 then
    begin
      insert into public.matches (
        id,
        pool_key,
        status,
        snapshot,
        rated,
        version,
        updated_at
      )
      values (
        p_match_id,
        p_pool_key,
        p_status,
        p_snapshot,
        p_rated,
        1,
        now()
      );
      v_next_version := 1;
    exception
      when unique_violation then
        return query select false, 'version_conflict', null::integer;
        return;
    end;
  else
    update public.matches
    set
      pool_key = p_pool_key,
      status = p_status,
      snapshot = p_snapshot,
      rated = p_rated,
      version = p_expected_version + 1,
      updated_at = now()
    where id = p_match_id
      and version = p_expected_version
    returning public.matches.version into v_next_version;

    if v_next_version is null then
      if exists (select 1 from public.matches where id = p_match_id) then
        return query select false, 'version_conflict', null::integer;
      else
        return query select false, 'not_found', null::integer;
      end if;
      return;
    end if;
  end if;

  insert into public.match_events (match_id, event_type, payload)
  select
    p_match_id,
    coalesce(event_payload ->> 'type', 'UNKNOWN'),
    event_payload
  from jsonb_array_elements(p_events) as event_payload;

  return query select true, null::text, v_next_version;
end;
$$;

revoke all on function public.commit_match_update(
  uuid,
  integer,
  jsonb,
  text,
  jsonb,
  boolean,
  jsonb
) from public;

grant execute on function public.commit_match_update(
  uuid,
  integer,
  jsonb,
  text,
  jsonb,
  boolean,
  jsonb
) to service_role;
