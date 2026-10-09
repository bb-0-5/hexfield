-- Build 295: human feedback for the new landscape/letterform disciplines.
-- Keep it separate from the earlier field/taste model; never recategorise or delete historic votes.
create table if not exists public.hexfield_studio_votes (
  client_id uuid primary key,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('landscape','lettering')),
  liked boolean not null,
  recipe jsonb not null check (jsonb_typeof(recipe) = 'object' and pg_column_size(recipe) <= 4000),
  features jsonb not null check (jsonb_typeof(features) = 'object' and pg_column_size(features) <= 1500),
  created_at timestamptz not null default now()
);
create index if not exists hexfield_studio_votes_recent on public.hexfield_studio_votes (created_at desc);
create index if not exists hexfield_studio_votes_mode_recent on public.hexfield_studio_votes (mode, created_at desc);
alter table public.hexfield_studio_votes enable row level security;
revoke all on table public.hexfield_studio_votes from anon;
revoke all on table public.hexfield_studio_votes from authenticated;
grant insert, select on table public.hexfield_studio_votes to authenticated;
drop policy if exists hexfield_studio_votes_owner_insert on public.hexfield_studio_votes;
create policy hexfield_studio_votes_owner_insert on public.hexfield_studio_votes
  for insert to authenticated with check (visitor_id = (select auth.uid()));
drop policy if exists hexfield_studio_votes_owner_read on public.hexfield_studio_votes;
create policy hexfield_studio_votes_owner_read on public.hexfield_studio_votes
  for select to authenticated using (visitor_id = (select auth.uid()));

-- Expose only aggregate preferences, never personal votes or private logo text.
-- Three distinct contributing visitors are required before any signal is public.
create or replace function public.hexfield_studio_shared_taste(p_mode text)
returns table(feature text, value text, keeps bigint, rejects bigint, visitor_count bigint)
language plpgsql stable security definer set search_path = ''
as $shared$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_mode not in ('landscape','lettering') then
    raise exception 'invalid discipline' using errcode = '22023';
  end if;
  return query
  select kv.key::text, kv.value::text,
      count(*) filter (where v.liked)::bigint,
      count(*) filter (where not v.liked)::bigint,
      count(distinct v.visitor_id)::bigint
  from public.hexfield_studio_votes v
  cross join lateral jsonb_each_text(v.features) as kv(key,value)
  where v.mode = p_mode and v.created_at > now() - interval '90 days'
    and kv.key in ('scene','mood','style','type')
  group by kv.key,kv.value
  having count(distinct v.visitor_id) >= 3
  order by count(*) desc
  limit 50;
end;
$shared$;
revoke execute on function public.hexfield_studio_shared_taste(text) from public, anon;
grant execute on function public.hexfield_studio_shared_taste(text) to authenticated;
