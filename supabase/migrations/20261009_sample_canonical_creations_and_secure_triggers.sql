-- Build 294: the canonical creations ledger already contains >14k valid 64-cell
-- signatures, whereas the new live-update archive started empty. Sample BOTH.
-- SECURITY DEFINER limits public access to the function's narrow result shape.
create or replace function public.sample_hexfield_signatures(p_limit integer default 500)
returns table(signature jsonb)
language plpgsql volatile security definer set search_path = ''
as $fn$
declare
  wanted integer := greatest(1, least(500, coalesce(p_limit,500)));
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  return query
  with all_signatures as materialized (
    select c.created_at, c.signature
    from public.hexfield_creations as c
    where jsonb_typeof(c.signature) = 'array'
      and jsonb_array_length(c.signature) = 64
    union all
    select a.created_at, a.signature
    from public.hexfield_render_signatures as a
  ),
  newest as materialized (
    select s.created_at, s.signature
    from all_signatures s
    order by s.created_at desc
    limit greatest(1,wanted/2)
  ),
  older as (
    select s.signature
    from all_signatures s
    where s.created_at < coalesce((select min(n.created_at) from newest n),now())
    order by random()
    limit greatest(0,wanted - (select count(*) from newest))
  )
  select n.signature from newest as n
  union all
  select o.signature from older as o;
end;
$fn$;
revoke all on function public.sample_hexfield_signatures(integer) from public, anon;
grant execute on function public.sample_hexfield_signatures(integer) to authenticated;
-- Utility trigger functions have no reason to be callable from public-facing roles.
revoke execute on function public.fold_hexfield_taste_observation() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
