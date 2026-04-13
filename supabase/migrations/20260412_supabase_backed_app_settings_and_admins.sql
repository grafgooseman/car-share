begin;

create schema if not exists private;

revoke all on schema private from public;

create table if not exists public.app_settings (
  key text primary key,
  group_key text not null,
  label text not null,
  help_text text not null,
  rationale text not null,
  source_note text,
  value_type text not null check (value_type in ('text', 'number', 'integer')),
  text_value text,
  numeric_value numeric,
  unit text not null default '',
  decimals integer not null default 0,
  sort_order integer not null,
  is_public boolean not null default true,
  editable_by_admin boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint app_settings_value_shape check (
    (
      value_type = 'text'
      and text_value is not null
      and numeric_value is null
    )
    or (
      value_type = 'number'
      and numeric_value is not null
      and text_value is null
    )
    or (
      value_type = 'integer'
      and numeric_value is not null
      and numeric_value = trunc(numeric_value)
      and text_value is null
    )
  )
);

create table if not exists public.app_setting_revisions (
  id bigint generated always as identity primary key,
  setting_key text not null references public.app_settings (key) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users (id) on delete set null,
  previous_row jsonb not null,
  new_row jsonb not null
);

create table if not exists public.app_admin_registration_codes (
  id bigint generated always as identity primary key,
  label text not null unique,
  code_hash text not null,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_from_code_id bigint references public.app_admin_registration_codes (id) on delete set null
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.app_admin_users
    where user_id = auth.uid()
      and is_active
  );
$$;

create or replace function public.hook_validate_admin_signup(event jsonb)
returns jsonb
language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  signup_kind text := coalesce(event -> 'user' -> 'user_metadata' ->> 'signup_kind', '');
  signup_code text := coalesce(event -> 'user' -> 'user_metadata' ->> 'admin_signup_code', '');
  matched_code_id bigint;
begin
  if signup_kind <> 'admin' then
    return '{}'::jsonb;
  end if;

  if signup_code = '' then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'message', 'The admin registration code is required.',
        'http_code', 403
      )
    );
  end if;

  select id
  into matched_code_id
  from public.app_admin_registration_codes
  where is_active
    and code_hash = crypt(signup_code, code_hash)
  limit 1;

  if matched_code_id is null then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'message', 'The admin registration code is invalid or inactive.',
        'http_code', 403
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

create or replace function private.handle_auth_user_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = auth, public, extensions, pg_temp
as $$
declare
  signup_kind text := coalesce(new.raw_user_meta_data ->> 'signup_kind', '');
  signup_code text := coalesce(new.raw_user_meta_data ->> 'admin_signup_code', '');
  matched_code_id bigint;
  display_name_value text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
begin
  if signup_kind = 'admin' and signup_code <> '' then
    select id
    into matched_code_id
    from public.app_admin_registration_codes
    where is_active
      and code_hash = crypt(signup_code, code_hash)
    limit 1;

    if matched_code_id is not null then
      insert into public.app_admin_users (
        user_id,
        email,
        display_name,
        created_from_code_id
      )
      values (
        new.id,
        new.email,
        display_name_value,
        matched_code_id
      )
      on conflict (user_id) do update
      set email = excluded.email,
          display_name = excluded.display_name,
          is_active = true,
          created_from_code_id = coalesce(public.app_admin_users.created_from_code_id, excluded.created_from_code_id);

      update public.app_admin_registration_codes
      set usage_count = usage_count + 1,
          last_used_at = now(),
          updated_at = now()
      where id = matched_code_id;
    end if;
  end if;

  if new.raw_user_meta_data ? 'admin_signup_code' then
    update auth.users
    set raw_user_meta_data = new.raw_user_meta_data - 'admin_signup_code'
    where id = new.id;
  end if;

  return new;
end;
$$;

create or replace function private.stamp_app_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function private.audit_app_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.app_setting_revisions (
    setting_key,
    changed_by,
    previous_row,
    new_row
  )
  values (
    new.key,
    auth.uid(),
    to_jsonb(old),
    to_jsonb(new)
  );

  return new;
end;
$$;

drop trigger if exists trg_app_admin_registration_codes_updated_at on public.app_admin_registration_codes;
create trigger trg_app_admin_registration_codes_updated_at
before update on public.app_admin_registration_codes
for each row
execute function private.set_updated_at();

drop trigger if exists trg_app_settings_stamp on public.app_settings;
create trigger trg_app_settings_stamp
before update on public.app_settings
for each row
execute function private.stamp_app_settings_update();

drop trigger if exists trg_app_settings_audit on public.app_settings;
create trigger trg_app_settings_audit
after update on public.app_settings
for each row
execute function private.audit_app_settings_update();

drop trigger if exists trg_auth_users_admin_signup on auth.users;
create trigger trg_auth_users_admin_signup
after insert on auth.users
for each row
execute function private.handle_auth_user_admin_signup();

alter table public.app_settings enable row level security;
alter table public.app_setting_revisions enable row level security;
alter table public.app_admin_users enable row level security;
alter table public.app_admin_registration_codes enable row level security;

drop policy if exists "Public can view public app settings" on public.app_settings;
create policy "Public can view public app settings"
on public.app_settings
for select
to anon, authenticated
using (is_public);

drop policy if exists "Admins can view all app settings" on public.app_settings;
create policy "Admins can view all app settings"
on public.app_settings
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "Admins can update editable app settings" on public.app_settings;
create policy "Admins can update editable app settings"
on public.app_settings
for update
to authenticated
using (editable_by_admin and (select private.is_app_admin()))
with check (editable_by_admin and (select private.is_app_admin()));

drop policy if exists "Admins can view app setting revisions" on public.app_setting_revisions;
create policy "Admins can view app setting revisions"
on public.app_setting_revisions
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "Users can view their admin record" on public.app_admin_users;
create policy "Users can view their admin record"
on public.app_admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can view admin users" on public.app_admin_users;
create policy "Admins can view admin users"
on public.app_admin_users
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "Supabase auth admin can read registration codes" on public.app_admin_registration_codes;
create policy "Supabase auth admin can read registration codes"
on public.app_admin_registration_codes
for select
to supabase_auth_admin
using (true);

grant usage on schema public to anon, authenticated, supabase_auth_admin;
grant usage on schema private to authenticated;

grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
grant select on public.app_setting_revisions to authenticated;
grant select on public.app_admin_users to authenticated;

grant select on public.app_admin_registration_codes to supabase_auth_admin;

grant execute on function public.hook_validate_admin_signup(jsonb) to supabase_auth_admin;
grant execute on function private.is_app_admin() to authenticated;

revoke all on public.app_admin_registration_codes from anon, authenticated;
revoke execute on function public.hook_validate_admin_signup(jsonb) from anon, authenticated, public;

insert into public.app_settings (
  key,
  group_key,
  label,
  help_text,
  rationale,
  source_note,
  value_type,
  text_value,
  numeric_value,
  unit,
  decimals,
  sort_order,
  is_public,
  editable_by_admin
)
values
  (
    'carName',
    'costs',
    'Car model',
    'The calculator is configured for this specific car and its operating costs.',
    'This keeps the calculator tied to the Honda Civic used in the original spreadsheet so all per-km assumptions stay internally consistent.',
    'Original spreadsheet vehicle reference.',
    'text',
    'Honda Civic LX 4DR Sedan 2012',
    null,
    '',
    0,
    10,
    true,
    true
  ),
  (
    'gasPer100Km',
    'costs',
    'Gas / 100 km',
    'Fuel consumption baseline taken from the car specification in the spreadsheet.',
    '9.4 L / 100 km reflects the spreadsheet baseline for the specific Civic and is the consumption figure used to derive fuel cost per kilometer.',
    'Spreadsheet fuel-consumption baseline.',
    'number',
    null,
    9.4,
    'L',
    1,
    20,
    true,
    true
  ),
  (
    'gasPricePerLiter',
    'costs',
    'Gas price / L',
    'Current gas price used as the fuel input for the trip.',
    '1.78 CA$ / L is the assumed gas price the current calculator uses for every trip estimate until an admin updates it.',
    'Spreadsheet cost input carried into the app.',
    'number',
    null,
    1.78,
    'CA$',
    2,
    30,
    true,
    true
  ),
  (
    'insurancePerKm',
    'costs',
    'Insurance / km',
    'Fixed insurance allocation charged for each kilometer driven.',
    '0.16 CA$ / km distributes the car insurance burden across distance so each trip carries part of the standing insurance cost.',
    'Spreadsheet insurance allocation.',
    'number',
    null,
    0.16,
    'CA$',
    2,
    40,
    true,
    true
  ),
  (
    'parkingPerDay',
    'costs',
    'Parking / day',
    'Flat daily parking amount carried over from the spreadsheet.',
    '2.4 CA$ / day is the default parking assumption used by the current calculation model for multi-day trips.',
    'Spreadsheet parking assumption.',
    'number',
    null,
    2.4,
    'CA$',
    2,
    50,
    true,
    true
  ),
  (
    'depreciationPerKm',
    'costs',
    'Depreciation / km',
    'Wear on the car value attributed to each kilometer.',
    '0.03 CA$ / km represents the loss in vehicle value assigned to usage so the owner is compensated for long-term wear.',
    'Spreadsheet depreciation estimate.',
    'number',
    null,
    0.03,
    'CA$',
    2,
    60,
    true,
    true
  ),
  (
    'maintenancePerKm',
    'costs',
    'Maintenance + tire wear / km',
    'Routine maintenance and tire usage distributed across distance driven.',
    '0.065 CA$ / km covers recurring service and tire wear that accumulate with mileage, not just fuel.',
    'Spreadsheet maintenance estimate.',
    'number',
    null,
    0.065,
    'CA$',
    3,
    70,
    true,
    true
  ),
  (
    'riskPerKm',
    'costs',
    'Risk / km',
    'Allowance for collision, towing, tickets, small damage, or cleaning risk.',
    '0.04 CA$ / km adds a risk buffer so shared trips account for incidental downside beyond routine operating costs.',
    'Spreadsheet risk allowance.',
    'number',
    null,
    0.04,
    'CA$',
    2,
    80,
    true,
    true
  ),
  (
    'maxPersonsInCar',
    'trip_rules',
    'Maximum persons in car',
    'Upper bound used to clamp the passenger count input, including the driver.',
    '5 matches the current UI limit and keeps the calculator aligned with the intended seating capacity for this app.',
    'Current frontend input constraint.',
    'integer',
    null,
    5,
    'persons',
    0,
    90,
    true,
    true
  ),
  (
    'defaultKilometers',
    'trip_defaults',
    'Default kilometers',
    'Initial kilometers value shown when the calculator first loads.',
    '120 is the seeded starting distance so the calculator opens with a realistic sample trip instead of a blank state.',
    'Current frontend default input.',
    'number',
    null,
    120,
    'km',
    0,
    100,
    true,
    true
  ),
  (
    'defaultDays',
    'trip_defaults',
    'Default days',
    'Initial days value shown when the calculator first loads.',
    '2 is the seeded default duration used by the current app to demonstrate parking and daily trip costs.',
    'Current frontend default input.',
    'number',
    null,
    2,
    'days',
    0,
    110,
    true,
    true
  ),
  (
    'defaultPersonsInCar',
    'trip_defaults',
    'Default persons in car',
    'Initial passenger count shown when the calculator first loads, including the driver.',
    '3 is the seeded starting occupancy used in the current calculator to show a shared-cost scenario immediately.',
    'Current frontend default input.',
    'integer',
    null,
    3,
    'persons',
    0,
    120,
    true,
    true
  )
on conflict (key) do update
set group_key = excluded.group_key,
    label = excluded.label,
    help_text = excluded.help_text,
    rationale = excluded.rationale,
    source_note = excluded.source_note,
    value_type = excluded.value_type,
    text_value = excluded.text_value,
    numeric_value = excluded.numeric_value,
    unit = excluded.unit,
    decimals = excluded.decimals,
    sort_order = excluded.sort_order,
    is_public = excluded.is_public,
    editable_by_admin = excluded.editable_by_admin;

insert into public.app_admin_registration_codes (
  label,
  code_hash,
  is_active,
  notes
)
values (
  'default-stepanjew',
  crypt('stepanjew', gen_salt('bf')),
  true,
  'Seeded reusable admin registration code for initial setup.'
)
on conflict (label) do update
set code_hash = excluded.code_hash,
    is_active = excluded.is_active,
    notes = excluded.notes;

commit;
