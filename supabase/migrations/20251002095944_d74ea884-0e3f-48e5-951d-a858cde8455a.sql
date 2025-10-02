-- 1. Add explicit RLS INSERT policy with WITH CHECK for admins and super users
create policy "Admins can insert org members"
on public.organization_members
for insert
to authenticated
with check (
  is_current_user_super_user() = true
  or (
    is_current_user_organization_admin() = true
    and organization_id = get_current_user_organization_id()
  )
);

-- 2. Add explicit RLS UPDATE policy with both USING and WITH CHECK for admins and super users
create policy "Admins can update org members"
on public.organization_members
for update
to authenticated
using (
  is_current_user_super_user() = true
  or (
    is_current_user_organization_admin() = true
    and organization_id = get_current_user_organization_id()
  )
)
with check (
  is_current_user_super_user() = true
  or (
    is_current_user_organization_admin() = true
    and organization_id = get_current_user_organization_id()
  )
);

-- 3. Add unique constraint required by manage_organization_admins function
alter table public.organization_admins
add constraint organization_admins_org_member_unique unique (organization_id, member_id);

-- 4. Attach trigger to keep organization_admins in sync when members are added/updated/deleted
drop trigger if exists trg_manage_organization_admins on public.organization_members;
create trigger trg_manage_organization_admins
before insert or update or delete on public.organization_members
for each row execute function public.manage_organization_admins();

-- 5. One-time backfill: populate organization_admins for all existing admin members
insert into public.organization_admins (organization_id, member_id, permissions)
select om.organization_id, om.id, '{"manage_members": true, "manage_settings": true, "manage_training": true}'::jsonb
from public.organization_members om
left join public.organization_admins oa
  on oa.organization_id = om.organization_id and oa.member_id = om.id
where om.role = 'admin' and oa.member_id is null;