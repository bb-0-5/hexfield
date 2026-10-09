-- Build 300: recover from failed hosted image generation without silently
-- using up all of a visitor's successful-painting allowance.
-- A new attempt reserves a slot for three minutes; only the Worker marks a
-- delivered model image completed. User quota: three completed/day, ten attempts.
-- Site budget: at most sixty attempts/day, including failures.
alter table public.hexfield_imagination_claims
  add column if not exists state text not null default 'reserved',
  add column if not exists completed_at timestamptz;
do $migration$ begin
  if not exists (
    select 1 from pg_constraint where conname='hexfield_imagination_claims_valid_state'
      and conrelid='public.hexfield_imagination_claims'::regclass
  ) then
    alter table public.hexfield_imagination_claims
      add constraint hexfield_imagination_claims_valid_state
      check (state in ('reserved','completed','expired'));
  end if;
end $migration$;
-- The original Build 299 quota lacked success confirmation.
-- Unverifiable older reservations are expired rather than presented as art.
update public.hexfield_imagination_claims set state='expired'
where state='reserved' and completed_at is null
  and created_at < now() - interval '2 minutes';

create or replace function public.claim_hexfield_imagination(p_request_id uuid)
returns integer language plpgsql security definer set search_path=''
as $function$
declare
  who uuid := (select auth.uid());
  today date := timezone('utc',now())::date;
  completed_count int;
  active_count int;
  attempts int;
  site_attempts int;
  site_completed int;
  prior uuid;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_request_id is null then raise exception 'Request ID required' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(1982311,1982309);
  select visitor_id into prior from public.hexfield_imagination_claims where request_id=p_request_id;
  if found then
    if prior <> who then raise exception 'Request ID belongs to another visitor' using errcode='42501'; end if;
    raise exception 'This image request was already submitted' using errcode='P0001';
  end if;
  select count(*) filter(where state='completed'),
    count(*) filter(where state='reserved' and created_at>now()-interval '3 minutes'),count(*)
  into completed_count,active_count,attempts from public.hexfield_imagination_claims
  where claim_day=today and visitor_id=who;
  select count(*),count(*) filter(where state='completed')
  into site_attempts,site_completed from public.hexfield_imagination_claims where claim_day=today;
  if completed_count>=3 then raise exception 'Three paintings completed today. Come back tomorrow (UTC).' using errcode='P0001'; end if;
  if active_count>=2 then raise exception 'Two paintings are still processing. Retry in a couple of minutes.' using errcode='P0001'; end if;
  if attempts>=10 then raise exception 'Daily retry safety limit reached. Come back tomorrow (UTC).' using errcode='P0001'; end if;
  if site_attempts>=60 or site_completed>=60 then raise exception 'The studio daily image budget is exhausted.' using errcode='P0001'; end if;
  insert into public.hexfield_imagination_claims(request_id,visitor_id,claim_day,state)
  values (p_request_id,who,today,'reserved');
  return greatest(0,3-completed_count-active_count-1);
end;
$function$;
revoke all on function public.claim_hexfield_imagination(uuid) from public,anon;
grant execute on function public.claim_hexfield_imagination(uuid) to authenticated;

create or replace function public.complete_hexfield_imagination(p_request_id uuid)
returns integer language plpgsql security definer set search_path=''
as $function$
declare
  who uuid := (select auth.uid());
  row_owner uuid;
  row_state text;
  total_done int;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(1982311,1982309);
  select visitor_id,state into row_owner,row_state from public.hexfield_imagination_claims
    where request_id=p_request_id for update;
  if not found or row_owner<>who then raise exception 'Unknown image request' using errcode='42501'; end if;
  if row_state='expired' then raise exception 'Request expired' using errcode='P0001'; end if;
  if row_state='reserved' then
    update public.hexfield_imagination_claims set state='completed',completed_at=now()
      where request_id=p_request_id;
  end if;
  select count(*) into total_done from public.hexfield_imagination_claims
    where claim_day=timezone('utc',now())::date and visitor_id=who and state='completed';
  return greatest(0,3-total_done);
end;
$function$;
revoke all on function public.complete_hexfield_imagination(uuid) from public,anon;
grant execute on function public.complete_hexfield_imagination(uuid) to authenticated;

create or replace function public.hexfield_imagination_remaining()
returns jsonb language plpgsql stable security definer set search_path=''
as $function$
declare
  who uuid := (select auth.uid());
  done int;
  inflight int;
  attempted int;
  site_attempted int;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select count(*) filter(where state='completed'),
    count(*) filter(where state='reserved' and created_at>now()-interval '3 minutes'),count(*)
  into done,inflight,attempted from public.hexfield_imagination_claims
  where claim_day=timezone('utc',now())::date and visitor_id=who;
  select count(*) into site_attempted from public.hexfield_imagination_claims
    where claim_day=timezone('utc',now())::date;
  return jsonb_build_object('paintings_remaining',greatest(0,3-done),
    'in_progress',inflight,'retry_attempts_remaining',greatest(0,10-attempted),
    'site_attempts_remaining',greatest(0,60-site_attempted));
end;
$function$;
revoke all on function public.hexfield_imagination_remaining() from public,anon;
grant execute on function public.hexfield_imagination_remaining() to authenticated;