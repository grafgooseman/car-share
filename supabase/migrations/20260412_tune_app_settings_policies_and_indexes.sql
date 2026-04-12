begin;

create index if not exists app_admin_users_created_from_code_id_idx
  on public.app_admin_users (created_from_code_id);

create index if not exists app_setting_revisions_changed_by_idx
  on public.app_setting_revisions (changed_by);

create index if not exists app_setting_revisions_setting_key_idx
  on public.app_setting_revisions (setting_key);

create index if not exists app_settings_updated_by_idx
  on public.app_settings (updated_by);

drop policy if exists "Public can view public app settings" on public.app_settings;
drop policy if exists "Admins can view all app settings" on public.app_settings;

create policy "Anon can view public app settings"
on public.app_settings
for select
to anon
using (is_public);

create policy "Authenticated can view app settings"
on public.app_settings
for select
to authenticated
using (is_public or (select private.is_app_admin()));

drop policy if exists "Users can view their admin record" on public.app_admin_users;
drop policy if exists "Admins can view admin users" on public.app_admin_users;

create policy "Authenticated can view relevant admin users"
on public.app_admin_users
for select
to authenticated
using (((select auth.uid()) = user_id) or (select private.is_app_admin()));

commit;
