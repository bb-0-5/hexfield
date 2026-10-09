-- Hexfield Studio 299. Model-backed imagination, never unmetered public inference.
-- Only two human choices: an image model and explicit human taste signals.
-- Existing procedural museum and its votes remain unchanged.
create table if not exists public.hexfield_imagination_claims (
  request_id uuid primary key,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  claim_day date not null default (timezone('utc',now())::date),
  created_at timestamptz not null default now()
);
create index if not exists hexfield_imagination_claims_day on public.hexfield_imagination_claims(claim_day,visitor_id);
alter table public.hexfield_imagination_claims enable row level security;
revoke all on public.hexfield_imagination_claims from public, anon, authenticated;

create or replace function public.claim_hexfield_imagination(p_request_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare
  who uuid := (select auth.uid());
  today date := timezone('utc',now())::date;
  used integer;
  shared_used integer;
  previous uuid;
begin
  if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_request_id is null then raise exception 'Request ID required' using errcode='22023'; end if;
  -- Serializes the daily budget across all callers and all Worker isolates.
  perform pg_advisory_xact_lock(1982311,1982309);
  select visitor_id into previous from public.hexfield_imagination_claims where request_id=p_request_id;
  if found then
    if previous <> who then raise exception 'Request ID belongs to another visitor' using errcode='42501'; end if;
    select count(*) into used from public.hexfield_imagination_claims where claim_day=today and visitor_id=who;
    raise exception 'This image request has already been used' using errcode='P0001';
  end if;
  select count(*) into used from public.hexfield_imagination_claims where claim_day=today and visitor_id=who;
  select count(*) into shared_used from public.hexfield_imagination_claims where claim_day=today;
  if used >= 3 then raise exception 'Your three daily paintings have been used' using errcode='P0001'; end if;
  if shared_used >= 60 then raise exception 'The studio daily AI budget is exhausted' using errcode='P0001'; end if;
  insert into public.hexfield_imagination_claims(request_id,visitor_id,claim_day)
    values(p_request_id,who,today);
  return 2-used;
end;
$function$;
revoke all on function public.claim_hexfield_imagination(uuid) from public, anon;
grant execute on function public.claim_hexfield_imagination(uuid) to authenticated;

create table if not exists public.hexfield_imagination_feedback (
  id uuid primary key,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  image_id uuid not null,
  liked boolean not null,
  idea text not null check (char_length(idea)<=360),
  prompt text not null check (char_length(prompt)<=1400),
  critique text not null default '' check (char_length(critique)<=400),
  method_note text not null default '' check (char_length(method_note)<=220),
  created_at timestamptz not null default now()
);
create index if not exists hexfield_imagination_feedback_recent on public.hexfield_imagination_feedback(visitor_id,created_at desc);
alter table public.hexfield_imagination_feedback enable row level security;
revoke all on public.hexfield_imagination_feedback from public, anon;
grant select,insert on public.hexfield_imagination_feedback to authenticated;
drop policy if exists hexfield_imagination_feedback_own_read on public.hexfield_imagination_feedback;
create policy hexfield_imagination_feedback_own_read on public.hexfield_imagination_feedback
  for select to authenticated using (visitor_id=(select auth.uid()));
drop policy if exists hexfield_imagination_feedback_own_insert on public.hexfield_imagination_feedback;
create policy hexfield_imagination_feedback_own_insert on public.hexfield_imagination_feedback
  for insert to authenticated with check (visitor_id=(select auth.uid()));
