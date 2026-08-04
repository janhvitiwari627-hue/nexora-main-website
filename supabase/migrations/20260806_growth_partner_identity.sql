-- Nexora Section 2 / Phase 3 — Growth Partner identity contract
--
-- Creates the partner identity and referral code only for an existing active
-- profiles.platform_role = growth_partner account. The browser cannot choose
-- or mutate a role; it can only call this server-owned bootstrap after login.

create or replace function public.ensure_growth_partner_identity()
returns table (
  id uuid,
  user_id uuid,
  partner_code text,
  referral_code text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
  profile_role text;
  existing public.growth_partners%rowtype;
  generated_code text;
  generated_referral text;
begin
  if caller is null then
    raise exception 'authentication required';
  end if;

  select p.platform_role
    into profile_role
  from public.profiles p
  where p.id = caller
    and p.is_active = true;

  if profile_role is distinct from 'growth_partner' then
    raise exception 'active Growth Partner role required';
  end if;

  select gp.* into existing
  from public.growth_partners gp
  where gp.user_id = caller
  limit 1;

  if found then
    return query select existing.id, existing.user_id, existing.partner_code, existing.referral_code, existing.status;
    return;
  end if;

  generated_code := 'NXGP-' || upper(substr(replace(caller::text, '-', ''), 1, 10));
  generated_referral := 'REF-' || upper(substr(replace(caller::text, '-', ''), 11, 10));

  insert into public.growth_partners (user_id, partner_code, referral_code, status)
  values (caller, generated_code, generated_referral, 'applied')
  returning * into existing;

  return query select existing.id, existing.user_id, existing.partner_code, existing.referral_code, existing.status;
end
$function$;

revoke all on function public.ensure_growth_partner_identity() from public, anon;
grant execute on function public.ensure_growth_partner_identity() to authenticated, service_role;
