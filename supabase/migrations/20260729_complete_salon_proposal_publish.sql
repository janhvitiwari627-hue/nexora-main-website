create or replace function public.review_salon_setup(
  p_proposal_id uuid,
  p_action text,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := (select auth.uid());
  proposal public.salon_setup_proposals%rowtype;
  action text := lower(trim(coalesce(p_action, '')));
  next_status text;
begin
  if caller is null then raise exception 'authentication required'; end if;

  select *
  into proposal
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
      select 1
      from public.shop_attributions a
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
      growth_partner_id,
      salon_id,
      onboarding_application_id,
      attribution_method,
      status,
      effective_from,
      approved_by,
      approved_at,
      source_event_id,
      reason
    )
    select
      proposal.growth_partner_id,
      proposal.salon_id,
      proposal.onboarding_application_id,
      'import',
      'active',
      now(),
      caller,
      now(),
      'salon-setup-proposal:' || proposal.id::text,
      'Growth Partner proposal published by the assigned Shop Owner'
    where not exists (
      select 1
      from public.shop_attributions a
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
    proposal.id,
    proposal.version + 1,
    proposal.payload,
    caller,
    'shop_owner',
    action || coalesce(': ' || nullif(trim(coalesce(p_notes, '')), ''), '')
  );

  update public.salon_setup_proposals
  set version = version + 1
  where id = proposal.id;

  insert into public.notifications(
    recipient_user_id, salon_id, notification_type, title, message, data, channel
  )
  select
    gp.user_id,
    proposal.salon_id,
    'salon_setup_' || next_status,
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
