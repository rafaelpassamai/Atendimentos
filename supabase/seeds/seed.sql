-- Catalog seed data
insert into public.departments(name) values
  ('Support'),
  ('Billing'),
  ('Technical Operations')
on conflict do nothing;

insert into public.products(name) values
  ('Web Platform'),
  ('Mobile App'),
  ('Integrations')
on conflict do nothing;

insert into public.categories(name) values
  ('Incident'),
  ('Question'),
  ('Request')
on conflict do nothing;

-- Staff profile seed template:
-- 1) Create user in Supabase Auth dashboard first.
-- 2) Replace placeholders and run:
-- insert into public.profiles(id, full_name, email, user_type, is_active)
-- values
--   ('00000000-0000-0000-0000-000000000000', 'Admin User', 'admin@company.com', 'admin', true),
--   ('11111111-1111-1111-1111-111111111111', 'Support Agent', 'agent@company.com', 'agent', true)
-- on conflict (id) do update set
--   full_name = excluded.full_name,
--   email = excluded.email,
--   user_type = excluded.user_type,
--   is_active = excluded.is_active;
