create or replace function private.resolve_setup_owner(
  p_owner_email text,
  out owner_user_id uuid,
  out salon_id uuid
)
returns record
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    (
      select s.id
      from public.organization_members m
      join public.salons s
        on s.organization_id = m.organization_id
       and s.deleted_at is null
      where m.user_id = p.id
        and m.role = 'owner'
        and m.status = 'active'
      order by s.created_at
      limit 1
    )
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.platform_role = 'business_user'
    and p.is_active
    and lower(trim(u.email)) = lower(nullif(trim(p_owner_email), ''))
  limit 1
$function$;

create or replace function public.save_growth_partner_salon_setup(
  p_application_id uuid,
  p_payload jsonb,
  p_submit boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := (select auth.uid());
  partner_id uuid := private.current_growth_partner_id();
  application public.shop_onboarding_applications%rowtype;
  proposal public.salon_setup_proposals%rowtype;
  resolved_owner uuid;
  resolved_salon uuid;
  next_status text := case when p_submit then 'submitted' else 'draft' end;
  next_version integer;
begin
  if caller is null or partner_id is null then
    raise exception 'growth partner authentication required';
  end if;
  perform private.validate_salon_setup_payload(p_payload);

  select *
  into application
  from public.shop_onboarding_applications a
  where a.id = p_application_id
    and a.submitted_by_partner_id = partner_id;
  if not found then
    raise exception 'onboarding application not found';
  end if;

  resolved_salon := application.existing_salon_id;
  if resolved_salon is not null then
    select m.user_id
    into resolved_owner
    from public.salons s
    join public.organization_members m
      on m.organization_id = s.organization_id
      and m.role = 'owner'
      and m.status = 'active'
    where s.id = resolved_salon
    order by m.joined_at
    limit 1;
  else
    select r.owner_user_id, r.salon_id
    into resolved_owner, resolved_salon
    from private.resolve_setup_owner(application.owner_email) r;
  end if;

  if p_submit and resolved_owner is null then
    raise exception 'No active Shop Owner account matches this email. Check the email and ask the Owner to log in before submitting.';
  end if;

  select *
  into proposal
  from public.salon_setup_proposals p
  where p.onboarding_application_id = p_application_id
  for update;

  if found and proposal.status not in ('draft','changes_requested') then
    raise exception 'owner permission is required before editing this setup';
  end if;

  next_version := coalesce(proposal.version, 0) + 1;

  insert into public.salon_setup_proposals(
    onboarding_application_id,
    growth_partner_id,
    salon_id,
    owner_user_id,
    owner_email,
    status,
    payload,
    version,
    submitted_at
  )
  values (
    p_application_id,
    partner_id,
    resolved_salon,
    resolved_owner,
    lower(trim(application.owner_email)),
    next_status,
    p_payload,
    next_version,
    case when p_submit then now() end
  )
  on conflict (onboarding_application_id) do update
    set salon_id = coalesce(excluded.salon_id, public.salon_setup_proposals.salon_id),
        owner_user_id = coalesce(excluded.owner_user_id, public.salon_setup_proposals.owner_user_id),
        owner_email = excluded.owner_email,
        status = excluded.status,
        payload = excluded.payload,
        version = excluded.version,
        submitted_at = case
          when p_submit then now()
          else public.salon_setup_proposals.submitted_at
        end,
        owner_reviewed_at = null,
        owner_reviewed_by = null,
        owner_notes = null
  returning * into proposal;

  insert into public.salon_setup_proposal_versions(
    proposal_id, version, payload, changed_by, change_source
  )
  values (proposal.id, proposal.version, proposal.payload, caller, 'growth_partner');

  if p_submit then
    insert into public.notifications(
      recipient_user_id,
      salon_id,
      notification_type,
      title,
      message,
      data,
      channel
    )
    values (
      proposal.owner_user_id,
      proposal.salon_id,
      'salon_setup_submitted',
      'Website setup ready for review',
      'Your Growth Partner submitted a salon website setup. Preview it before publishing.',
      jsonb_build_object('proposal_id', proposal.id),
      'in_app'
    );
  end if;

  return proposal.id;
end
$function$;
