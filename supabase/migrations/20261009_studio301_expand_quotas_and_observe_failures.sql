-- Hexfield Studio 301 — permit sustained human-feedback experiments.
-- The former 3-successful-image cap made the studio appear to fail after a
-- few generations. This raises the per-visitor limit to 30 successful paintings
-- and 45 attempts, without raising the pre-existing 60-sitewide-attempt ceiling.
-- Worker failures are now categorised; no user prompts or image content logged.
alter table public.hexfield_imagination_claims
  add column if not exists failure_code text,
  add column if not exists failure_at timestamptz;
alter table public.hexfield_imagination_claims
  drop constraint if exists hexfield_imagination_claims_valid_state;
alter table public.hexfield_imagination_claims
  add constraint hexfield_imagination_claims_valid_state
  check (state in ('reserved','completed','expired','failed'));
alter table public.hexfield_imagination_claims
  add constraint hexfield_imagination_claims_failure_code_limit
  check (failure_code is null or
         (length(failure_code)<=50 and failure_code ~ '^[A-Z_]+$'));

create or replace function public.claim_hexfield_imagination(p_request_id uuid)
returns integer language plpgsql security definer set search_path=''
as $func$
declare
  who uuid := (select auth.uid());
  today date := timezone('utc',now())::date;
  completed_count int;
  active_count int;
  attempts int;
  site_attempts int;
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
  select count(*) into site_attempts from public.hexfield_imagination_claims
  where claim_day=today;
  if completed_count>=30 then
    raise exception 'You have completed 30 paintings today. The studio allowance resets at 00:00 UTC.' using errcode='P0001';
  end if;
  if active_count>=2 then
    raise exception 'Two paintings are already processing. Retry in a couple of minutes.' using errcode='P0001';
  end if;
  if attempts>=45 then
    raise exception 'You have reached the 45-attempt daily safety limit. It resets at 00:00 UTC.' using errcode='P0001';
  end if;
  if site_attempts>=60 then
    raise exception 'The shared studio has used its daily AI request budget. It resets at 00:00 UTC.' using errcode='P0001';
  end if;
  insert into public.hexfield_imagination_claims(request_id,visitor_id,claim_day,state)
  values(p_request_id,who,today,'reserved');
  return greatest(0,30-completed_count-active_count-1);
end;
$func$;
revoke all on function public.claim_hexfield_imagination(uuid) from public,anon;
grant execute on function public.claim_hexfield_imagination(uuid) to authenticated;

create or replace function public.complete_hexfield_imagination(p_request_id uuid)
returns integer language plpgsql security definer set search_path=''
as $func$
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
  if row_state='failed' or row_state='expired' then raise exception 'Request already ended' using errcode='P0001'; end if;
  if row_state='reserved' then
    update public.hexfield_imagination_claims set state='completed',completed_at=now()
    where request_id=p_request_id;
  end if;
  select count(*) into total_done from public.hexfield_imagination_claims
  where claim_day=timezone('utc',now())::date and visitor_id=who and state='completed';
  return greatest(0,30-total_done);
end;
$func$;
revoke all on function public.complete_hexfield_imagination(uuid) from public,anon;
grant execute on function public.complete_hexfield_imagination(uuid) to authenticated;

create or replace function public.fail_hexfield_imagination(p_request_id uuid,p_code text)
returns void language plpgsql security definer set search_path=''
as $func$
declare
  who uuid := (select auth.uid());
  row_owner uuid;
  row_state text;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_code not in ('MODEL_DAILY_LIMIT','MODEL_CAPACITY','MODEL_TIMEOUT',
      'MODEL_FAILED','MODEL_UNAVAILABLE','EMPTY_RESPONSE','CLIENT_ABORT') then
    raise exception 'Invalid failure code' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(1982311,1982309);
  select visitor_id,state into row_owner,row_state from public.hexfield_imagination_claims
  where request_id=p_request_id for update;
  if not found or row_owner<>who then raise exception 'Unknown image request' using errcode='42501'; end if;
  if row_state='reserved' then
    update public.hexfield_imagination_claims
    set state='failed',failure_code=p_code,failure_at=now()
    where request_id=p_request_id;
  end if;
end;
$func$;
revoke all on function public.fail_hexfield_imagination(uuid,text) from public,anon;
grant execute on function public.fail_hexfield_imagination(uuid,text) to authenticated;

create or replace function public.hexfield_imagination_remaining()
returns jsonb language plpgsql stable security definer set search_path=''
as $func$
declare
  who uuid := (select auth.uid());
  done int;
  inflight int;
  attempted int;
  site_attempted int;
  last_code text;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select count(*) filter(where state='completed'),
    count(*) filter(where state='reserved' and created_at>now()-interval '3 minutes'),count(*)
  into done,inflight,attempted from public.hexfield_imagination_claims
  where claim_day=timezone('utc',now())::date and visitor_id=who;
  select count(*) into site_attempted from public.hexfield_imagination_claims
  where claim_day=timezone('utc',now())::date;
  select failure_code into last_code from public.hexfield_imagination_claims
  where claim_day=timezone('utc',now())::date and visitor_id=who
    and state='failed' order by failure_at desc limit 1;
  return jsonb_build_object('paintings_remaining',greatest(0,30-done),
    'in_progress',inflight,'retry_attempts_remaining',greatest(0,45-attempted),
    'site_attempts_remaining',greatest(0,60-site_attempted),
    'last_model_error',last_code);
end;
$func$;
revoke all on function public.hexfield_imagination_remaining() from public,anon;
grant execute on function public.hexfield_imagination_remaining() to authenticated;
