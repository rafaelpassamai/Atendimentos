create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  user_type text not null check (user_type in ('admin','agent')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

create index if not exists idx_company_contacts_email on public.company_contacts (email);
create index if not exists idx_company_contacts_company on public.company_contacts (company_id);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  department_id uuid references public.departments(id),
  product_id uuid references public.products(id),
  category_id uuid references public.categories(id),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','waiting_customer','resolved','closed')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  created_by_user_id uuid references public.profiles(id),
  requested_by_contact_id uuid references public.company_contacts(id),
  requested_by_email text,
  assigned_to_user_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz,
  constraint chk_ticket_creator_or_contact
  check (created_by_user_id is not null or requested_by_contact_id is not null)
);

create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_company on public.tickets(company_id);
create index if not exists idx_tickets_assigned on public.tickets(assigned_to_user_id);
create index if not exists idx_tickets_contact on public.tickets(requested_by_contact_id);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_user_id uuid references public.profiles(id),
  author_contact_id uuid references public.company_contacts(id),
  is_internal boolean not null default false,
  content text not null,
  created_at timestamptz default now(),
  constraint chk_message_author
  check (
    (author_user_id is not null and author_contact_id is null)
    or
    (author_user_id is null and author_contact_id is not null)
  )
);

create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id);
create index if not exists idx_ticket_messages_created on public.ticket_messages(created_at);

create table if not exists public.ticket_public_access (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  token_hash text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_ticket_public_access_active on public.ticket_public_access(is_active);

create or replace function public.priority_rank(priority_value text)
returns integer
language sql
immutable
as $$
  select case priority_value
    when 'urgent' then 4
    when 'high' then 3
    when 'medium' then 2
    when 'low' then 1
    else 0
  end;
$$;

create or replace function public.list_tickets(
  p_user_id uuid,
  p_user_type text,
  p_tab text default 'queue',
  p_status text default null,
  p_priority text default null,
  p_department_id uuid default null,
  p_product_id uuid default null,
  p_category_id uuid default null,
  p_assigned_to_user_id uuid default null,
  p_search text default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table (
  id uuid,
  company_id uuid,
  department_id uuid,
  product_id uuid,
  category_id uuid,
  title text,
  description text,
  status text,
  priority text,
  created_by_user_id uuid,
  requested_by_contact_id uuid,
  requested_by_email text,
  assigned_to_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  company_name text,
  department_name text,
  product_name text,
  category_name text,
  assignee_email text,
  assignee_full_name text,
  creator_email text,
  creator_full_name text,
  contact_name text,
  contact_email text,
  total_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with visible as (
    select t.*
    from public.tickets t
    where
      (
        p_user_type = 'admin'
        or t.status = 'open'
        or t.assigned_to_user_id = p_user_id
        or t.created_by_user_id = p_user_id
      )
      and (
        p_tab is null
        or (p_tab = 'queue' and t.status = 'open')
        or (p_tab = 'my' and t.assigned_to_user_id = p_user_id)
        or (p_tab = 'all' and p_user_type = 'admin')
      )
      and (p_status is null or t.status = p_status)
      and (p_priority is null or t.priority = p_priority)
      and (p_department_id is null or t.department_id = p_department_id)
      and (p_product_id is null or t.product_id = p_product_id)
      and (p_category_id is null or t.category_id = p_category_id)
      and (p_assigned_to_user_id is null or t.assigned_to_user_id = p_assigned_to_user_id)
      and (p_search is null or t.title ilike '%' || p_search || '%')
  ), counted as (
    select v.*, count(*) over() as total_count
    from visible v
  )
  select
    c.id,
    c.company_id,
    c.department_id,
    c.product_id,
    c.category_id,
    c.title,
    c.description,
    c.status,
    c.priority,
    c.created_by_user_id,
    c.requested_by_contact_id,
    c.requested_by_email,
    c.assigned_to_user_id,
    c.created_at,
    c.updated_at,
    c.closed_at,
    comp.name as company_name,
    dep.name as department_name,
    prod.name as product_name,
    cat.name as category_name,
    assignee.email as assignee_email,
    assignee.full_name as assignee_full_name,
    creator.email as creator_email,
    creator.full_name as creator_full_name,
    contact.name as contact_name,
    contact.email as contact_email,
    c.total_count
  from counted c
  left join public.companies comp on comp.id = c.company_id
  left join public.departments dep on dep.id = c.department_id
  left join public.products prod on prod.id = c.product_id
  left join public.categories cat on cat.id = c.category_id
  left join public.profiles assignee on assignee.id = c.assigned_to_user_id
  left join public.profiles creator on creator.id = c.created_by_user_id
  left join public.company_contacts contact on contact.id = c.requested_by_contact_id
  order by public.priority_rank(c.priority) desc, c.created_at asc
  offset greatest((p_page - 1) * p_page_size, 0)
  limit p_page_size;
end;
$$;

create or replace function public.ticket_dashboard_summary(
  p_user_id uuid,
  p_user_type text
)
returns table (
  open bigint,
  in_progress bigint,
  waiting_customer bigint,
  resolved_today bigint,
  closed_today bigint
)
language sql
security definer
as $$
  with visible as (
    select *
    from public.tickets t
    where
      p_user_type = 'admin'
      or t.status = 'open'
      or t.assigned_to_user_id = p_user_id
      or t.created_by_user_id = p_user_id
  )
  select
    count(*) filter (where status = 'open') as open,
    count(*) filter (where status = 'in_progress') as in_progress,
    count(*) filter (where status = 'waiting_customer') as waiting_customer,
    count(*) filter (where status = 'resolved' and date(updated_at) = current_date) as resolved_today,
    count(*) filter (where status = 'closed' and closed_at is not null and date(closed_at) = current_date) as closed_today
  from visible;
$$;
