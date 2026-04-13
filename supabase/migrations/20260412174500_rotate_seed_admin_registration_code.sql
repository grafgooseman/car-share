update public.app_admin_registration_codes
set is_active = false
where label = 'default-testcode';

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
