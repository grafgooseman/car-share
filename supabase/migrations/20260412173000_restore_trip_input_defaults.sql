update public.app_settings
set numeric_value = 1,
    rationale = '1 is the seeded default duration so the calculator opens with a simple one-day trip.'
where key = 'defaultDays';

update public.app_settings
set numeric_value = 3,
    rationale = '3 is the seeded starting occupancy used in the current calculator to show a shared-cost scenario immediately.'
where key = 'defaultPersonsInCar';
