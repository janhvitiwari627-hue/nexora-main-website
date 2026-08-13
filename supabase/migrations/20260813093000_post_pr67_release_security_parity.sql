-- Forward-only parity migration generated from authorized live read-only metadata.
-- It is intentionally not applied to any hosted project by this repository change.

CREATE OR REPLACE FUNCTION private.publish_salon_setup(p_proposal salon_setup_proposals, p_owner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  profile jsonb := coalesce(p_proposal.payload->'profile', '{}'::jsonb);
  template jsonb := coalesce(p_proposal.payload->'template', '{}'::jsonb);
  item jsonb;
  target_id uuid;
  normalized_gender text;
  v_duration_minutes integer;
  v_price_paise bigint;
  discount_type text;
  discount_value bigint;
begin
  if p_proposal.salon_id is null then
    raise exception 'proposal is not linked to a Shop Owner salon';
  end if;

  normalized_gender := case lower(coalesce(profile->>'gender_category', ''))
    when 'women' then 'women_only'
    when 'women_only' then 'women_only'
    when 'men' then 'men_only'
    when 'men_only' then 'men_only'
    else 'unisex'
  end;

  update public.salons s
  set name = coalesce(nullif(trim(profile->>'name'), ''), s.name),
      description = coalesce(nullif(trim(profile->>'description'), ''), s.description),
      business_category = coalesce(nullif(trim(profile->>'business_category'), ''), s.business_category),
      gender_category = normalized_gender,
      phone = coalesce(nullif(trim(profile->>'phone'), ''), s.phone),
      email = coalesce(nullif(trim(profile->>'email'), ''), s.email),
      address = coalesce(nullif(trim(profile->>'address'), ''), s.address),
      area = coalesce(nullif(trim(profile->>'area'), ''), s.area),
      city = coalesce(nullif(trim(profile->>'city'), ''), s.city),
      state = coalesce(nullif(trim(profile->>'state'), ''), s.state),
      pincode = coalesce(nullif(trim(profile->>'pincode'), ''), s.pincode),
      logo_path = coalesce(nullif(trim(profile->>'logo_url'), ''), s.logo_path),
      cover_image_path = coalesce(nullif(trim(profile->>'cover_url'), ''), s.cover_image_path),
      starting_price_paise = coalesce(
        nullif(profile->>'starting_price_paise', '')::bigint,
        s.starting_price_paise
      ),
      accepts_online_bookings = true
  where s.id = p_proposal.salon_id;

  for item in select value from jsonb_array_elements(coalesce(p_proposal.payload->'services', '[]'::jsonb))
  loop
    if nullif(trim(item->>'name'), '') is null then continue; end if;
    v_duration_minutes := greatest(1, coalesce(nullif(item->>'duration_minutes', '')::integer, 30));
    v_price_paise := greatest(0, coalesce(nullif(item->>'price_paise', '')::bigint, 0));
    target_id := private.try_uuid(item->>'id');
    if target_id is null then
      select s.id into target_id
      from public.services s
      where s.salon_id = p_proposal.salon_id
        and lower(s.name) = lower(trim(item->>'name'))
        and s.deleted_at is null
      limit 1;
    end if;
    if target_id is null then
      insert into public.services(
        salon_id, name, description, duration_minutes, price_paise,
        is_active, is_bookable_online
      )
      values (
        p_proposal.salon_id, trim(item->>'name'), nullif(trim(item->>'description'), ''),
        v_duration_minutes, v_price_paise, true, true
      )
      returning id into target_id;
    else
      update public.services s
      set name = trim(item->>'name'),
          description = nullif(trim(item->>'description'), ''),
          duration_minutes = v_duration_minutes,
          price_paise = v_price_paise,
          is_active = true,
          is_bookable_online = true,
          deleted_at = null
      where s.id = target_id and s.salon_id = p_proposal.salon_id;
    end if;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_proposal.payload->'staff', '[]'::jsonb))
  loop
    if nullif(trim(item->>'name'), '') is null then continue; end if;
    target_id := private.try_uuid(item->>'id');
    if target_id is null then
      select s.id into target_id
      from public.staff s
      where s.salon_id = p_proposal.salon_id
        and lower(s.name) = lower(trim(item->>'name'))
        and s.deleted_at is null
      limit 1;
    end if;
    if target_id is null then
      insert into public.staff(
        salon_id, name, role_title, specialty, bio, avatar_path,
        employment_status, live_status
      )
      values (
        p_proposal.salon_id, trim(item->>'name'), nullif(trim(item->>'role_title'), ''),
        nullif(trim(item->>'specialty'), ''), nullif(trim(item->>'bio'), ''),
        nullif(trim(item->>'avatar_url'), ''), 'active', 'available'
      );
    else
      update public.staff s
      set name = trim(item->>'name'),
          role_title = nullif(trim(item->>'role_title'), ''),
          specialty = nullif(trim(item->>'specialty'), ''),
          bio = nullif(trim(item->>'bio'), ''),
          avatar_path = coalesce(nullif(trim(item->>'avatar_url'), ''), s.avatar_path),
          employment_status = 'active',
          deleted_at = null
      where s.id = target_id and s.salon_id = p_proposal.salon_id;
    end if;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_proposal.payload->'photos', '[]'::jsonb))
  loop
    if nullif(trim(item->>'url'), '') is null then continue; end if;
    if not exists (
      select 1 from public.salon_media m
      where m.salon_id = p_proposal.salon_id
        and m.storage_path = trim(item->>'url')
    ) then
      insert into public.salon_media(
        salon_id, storage_path, media_type, title, tag, alt_text,
        sort_order, is_cover, is_published, created_by
      )
      values (
        p_proposal.salon_id, trim(item->>'url'), 'image',
        nullif(trim(item->>'title'), ''), nullif(trim(item->>'tag'), ''),
        nullif(trim(item->>'alt_text'), ''),
        coalesce(nullif(item->>'sort_order', '')::integer, 0),
        coalesce((item->>'is_cover')::boolean, false), true, p_owner
      );
    end if;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_proposal.payload->'offers', '[]'::jsonb))
  loop
    if nullif(trim(item->>'code'), '') is null
      or nullif(trim(item->>'name'), '') is null then continue; end if;
    discount_type := case lower(item->>'discount_type')
      when 'fixed' then 'fixed' else 'percentage' end;
    discount_value := greatest(1, coalesce(nullif(item->>'discount_value', '')::bigint, 1));
    insert into public.offers(
      salon_id, code, name, description, discount_type, discount_value,
      maximum_discount_paise, minimum_booking_paise, total_redemption_limit,
      per_customer_limit, valid_from, valid_until, is_active, created_by
    )
    values (
      p_proposal.salon_id, upper(trim(item->>'code')), trim(item->>'name'),
      nullif(trim(item->>'description'), ''), discount_type, discount_value,
      nullif(item->>'maximum_discount_paise', '')::bigint,
      greatest(0, coalesce(nullif(item->>'minimum_booking_paise', '')::bigint, 0)),
      nullif(item->>'total_redemption_limit', '')::integer,
      greatest(1, coalesce(nullif(item->>'per_customer_limit', '')::integer, 1)),
      coalesce(nullif(item->>'valid_from', '')::timestamptz, now()),
      coalesce(nullif(item->>'valid_until', '')::timestamptz, now() + interval '30 days'),
      true, p_owner
    )
    on conflict (salon_id, code) do update
      set name = excluded.name,
          description = excluded.description,
          discount_type = excluded.discount_type,
          discount_value = excluded.discount_value,
          maximum_discount_paise = excluded.maximum_discount_paise,
          minimum_booking_paise = excluded.minimum_booking_paise,
          total_redemption_limit = excluded.total_redemption_limit,
          per_customer_limit = excluded.per_customer_limit,
          valid_from = excluded.valid_from,
          valid_until = excluded.valid_until,
          is_active = true,
          deleted_at = null;
  end loop;

  insert into public.salon_public_websites(
    salon_id, slug, template_key, config, is_published,
    published_revision, published_at, published_by
  )
  select
    s.id,
    s.slug,
    coalesce(nullif(trim(template->>'key'), ''), 'modern-salon'),
    jsonb_build_object(
      'profile', profile,
      'services', coalesce(p_proposal.payload->'services', '[]'::jsonb),
      'staff', coalesce(p_proposal.payload->'staff', '[]'::jsonb),
      'photos', coalesce(p_proposal.payload->'photos', '[]'::jsonb),
      'offers', coalesce(p_proposal.payload->'offers', '[]'::jsonb),
      'template', template
    ),
    true,
    p_proposal.version,
    now(),
    p_owner
  from public.salons s
  where s.id = p_proposal.salon_id
  on conflict (salon_id) do update
    set slug = excluded.slug,
        template_key = excluded.template_key,
        config = excluded.config,
        is_published = true,
        published_revision = excluded.published_revision,
        published_at = excluded.published_at,
        published_by = excluded.published_by;
end
$function$;

CREATE OR REPLACE FUNCTION private.validate_salon_setup_payload(p_payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'setup payload must be an object';
  end if;
  if octet_length(p_payload::text) > 1048576 then
    raise exception 'setup payload is too large';
  end if;
  if jsonb_typeof(coalesce(p_payload->'profile', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_payload->'services', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'staff', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'photos', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'offers', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload->'template', '{}'::jsonb)) <> 'object'
  then
    raise exception 'invalid setup payload sections';
  end if;
end
$function$;

CREATE OR REPLACE FUNCTION public.review_salon_setup(p_proposal_id uuid, p_action text, p_notes text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid := (select auth.uid());
  proposal public.salon_setup_proposals%rowtype;
  action text := lower(trim(coalesce(p_action, '')));
  next_status text;
begin
  if caller is null then raise exception 'authentication required'; end if;

  select * into proposal
  from public.salon_setup_proposals p
  where p.id = p_proposal_id
  for update;
  if not found then raise exception 'setup proposal not found'; end if;
  if proposal.salon_id is null or not private.can_manage_salon_settings(proposal.salon_id) then
    raise exception 'Shop Owner permission required';
  end if;

  if action = 'approve' and proposal.status = 'submitted' then
    next_status := 'approved';
  elsif action = 'publish' and proposal.status in ('submitted','approved') then
    if exists (
      select 1 from public.shop_attributions a
      where a.salon_id = proposal.salon_id
        and a.status = 'active'
        and a.effective_until is null
        and a.growth_partner_id <> proposal.growth_partner_id
    ) then
      raise exception 'salon is already attributed to another Growth Partner';
    end if;

    perform private.publish_salon_setup(proposal, caller);

    update public.salons
    set verified = true,
        is_active = true,
        accepts_online_bookings = true
    where id = proposal.salon_id;

    insert into public.shop_attributions(
      growth_partner_id, salon_id, onboarding_application_id,
      attribution_method, status, effective_from, approved_by,
      approved_at, source_event_id, reason
    )
    select
      proposal.growth_partner_id, proposal.salon_id,
      proposal.onboarding_application_id, 'import', 'active', now(),
      caller, now(), 'salon-setup-proposal:' || proposal.id::text,
      'Growth Partner proposal published by the assigned Shop Owner'
    where not exists (
      select 1 from public.shop_attributions a
      where a.salon_id = proposal.salon_id
        and a.status = 'active'
        and a.effective_until is null
    )
    on conflict (source_event_id) do nothing;

    next_status := 'published';
  elsif action = 'request_changes' and proposal.status in ('submitted','approved') then
    next_status := 'changes_requested';
  elsif action = 'grant_edit' and proposal.status = 'edit_requested' then
    next_status := 'changes_requested';
  elsif action = 'reject' and proposal.status in ('submitted','approved') then
    next_status := 'rejected';
  else
    raise exception 'invalid setup review transition';
  end if;

  update public.salon_setup_proposals
  set status = next_status,
      owner_reviewed_at = now(),
      owner_reviewed_by = caller,
      owner_notes = nullif(trim(coalesce(p_notes, '')), ''),
      published_at = case when next_status = 'published' then now() else published_at end
  where id = proposal.id;

  insert into public.salon_setup_proposal_versions(
    proposal_id, version, payload, changed_by, change_source, change_note
  )
  values (
    proposal.id, proposal.version + 1, proposal.payload, caller,
    'shop_owner', action || coalesce(': ' || nullif(trim(coalesce(p_notes, '')), ''), '')
  );

  update public.salon_setup_proposals
  set version = version + 1
  where id = proposal.id;

  insert into public.notifications(
    recipient_user_id, salon_id, notification_type, title, message, data, channel
  )
  select
    gp.user_id, proposal.salon_id, 'salon_setup_' || next_status,
    case next_status
      when 'published' then 'Salon website published'
      when 'changes_requested' then 'Shop Owner requested changes'
      when 'approved' then 'Salon website setup approved'
      else 'Salon website setup updated'
    end,
    coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Open the salon setup to view the latest status.'),
    jsonb_build_object('proposal_id', proposal.id, 'status', next_status),
    'in_app'
  from public.growth_partners gp
  where gp.id = proposal.growth_partner_id;

  return next_status;
end
$function$;

alter function private.publish_salon_setup(public.salon_setup_proposals, uuid) owner to postgres;
revoke all on function private.publish_salon_setup(public.salon_setup_proposals, uuid)
  from public, anon, authenticated, service_role;

alter function private.validate_salon_setup_payload(jsonb) owner to postgres;
revoke all on function private.validate_salon_setup_payload(jsonb)
  from public, anon, authenticated, service_role;

alter function public.review_salon_setup(uuid, text, text) owner to postgres;
revoke all on function public.review_salon_setup(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.review_salon_setup(uuid, text, text)
  to authenticated, service_role;

alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;

revoke all on table public.organization_members from anon;
revoke insert, update, delete on table public.organization_members from authenticated;
grant select on table public.organization_members to authenticated;
grant all on table public.organization_members to service_role;

drop policy if exists members_org_select on public.organization_members;
drop policy if exists members_owner_manager_insert on public.organization_members;
drop policy if exists members_owner_manager_update on public.organization_members;
drop policy if exists organization_members_self_read on public.organization_members;
drop policy if exists owner_gate_select on public.organization_members;

create policy organization_members_scoped_select
on public.organization_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_active_org_member(organization_id)
  or (select private.is_admin())
);

comment on policy organization_members_scoped_select on public.organization_members is
  'Authenticated users may read their own membership row; active organization members may read their organization roster; platform administrators may read all rows. Anonymous, inactive cross-member, and cross-organization access is denied. Direct authenticated writes are intentionally denied and must use authorized RPCs.';

create index if not exists organization_members_invited_by_idx
  on public.organization_members (invited_by);

comment on table public.organization_members is
  'RLS security boundary for organization membership. Authenticated clients have SELECT only; membership writes must use a separately authorized SECURITY DEFINER RPC.';

-- Rollback guidance (do not execute automatically): restore grants and policies
-- from the immediately preceding migration only after a security review. Dropping
-- this migration's index is optional and should be based on workload evidence.
