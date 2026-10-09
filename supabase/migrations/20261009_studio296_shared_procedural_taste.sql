-- Build 296: extend collective human feedback from scene/mood presets to
-- the operator grammars used by evolving landscape and lettering methods.
-- Personal votes remain private; only aggregates with >=3 distinct voters
-- leave this SECURITY DEFINER function. No human-entered logo text is emitted.
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
    and (
      (kv.key = 'scene' and kv.value in ('mountains','coast','forest','plains','hills','lake')) or
      (kv.key = 'mood' and kv.value in ('golden','mist','storm','twilight')) or
      (kv.key = 'style' and kv.value in ('geometric','minimal','heavy','elegant','experimental')) or
      (kv.key = 'type' and kv.value in ('wordmark','monogram','emblem')) or
      (kv.key = 'terrain' and kv.value in ('wave','fbm','ridge','terrace','dune','peak','basin','steps','noise',
          'fold','bend','carve','reverse','quantize','add','blend','cut','max','multiply')) or
      (kv.key = 'brush' and kv.value in ('contour','hatch','mosaic','knife','wash','stipple')) or
      (kv.key = 'sky' and kv.value in ('clouds','veils','bands','radial','flat')) or
      (kv.key = 'layout' and kv.value in ('valley','escarpment','sweep','basin','ridges','islands')) or
      (kv.key = 'growth' and kv.value in ('branch','spire','fan','grass','none')) or
      (kv.key = 'construction' and kv.value in ('upright','shear','squeeze','stagger','bridge','waist')) or
      (kv.key = 'stroke' and kv.value in ('solid','inline','outline','stencil','double')) or
      (kv.key = 'frame' and kv.value in ('none','box','ring','brackets','rails')) or
      (kv.key = 'joint' and kv.value in ('discrete','ligature','shared'))
    )
  group by kv.key,kv.value
  having count(distinct v.visitor_id) >= 3
  order by count(*) desc
  limit 70;
end;
$shared$;
revoke all on function public.hexfield_studio_shared_taste(text) from public, anon;
grant execute on function public.hexfield_studio_shared_taste(text) to authenticated;
