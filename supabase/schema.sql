-- WhatsApp CRM SaaS Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contacts table
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  email text,
  company text,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamptz not null default now()
);

-- Leads table
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  title text not null,
  description text,
  value numeric(12, 2),
  status text not null default 'new' check (status in ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  assigned_to text,
  created_at timestamptz not null default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  contact_id uuid references contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

-- Conversations table
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  phone_number text not null,
  last_message text,
  last_message_at timestamptz,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  content text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  created_at timestamptz not null default now()
);

-- Row Level Security (RLS) - Enable for all tables
alter table contacts enable row level security;
alter table leads enable row level security;
alter table tasks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- RLS Policies: allow authenticated users full access
create policy "Allow authenticated users" on contacts
  for all using (auth.role() = 'authenticated');

create policy "Allow authenticated users" on leads
  for all using (auth.role() = 'authenticated');

create policy "Allow authenticated users" on tasks
  for all using (auth.role() = 'authenticated');

create policy "Allow authenticated users" on conversations
  for all using (auth.role() = 'authenticated');

create policy "Allow authenticated users" on messages
  for all using (auth.role() = 'authenticated');

-- Sample data
insert into contacts (name, phone, email, company, status) values
  ('Alice Johnson', '+1-555-0101', 'alice@example.com', 'Acme Corp', 'active'),
  ('Bob Smith', '+1-555-0102', 'bob@techco.io', 'TechCo', 'active'),
  ('Carol White', '+1-555-0103', null, null, 'inactive'),
  ('David Brown', '+1-555-0104', 'david@startup.xyz', 'Startup XYZ', 'active'),
  ('Eva Green', '+1-555-0105', 'eva@design.co', 'Design Co', 'active')
on conflict (phone) do nothing;

insert into leads (contact_id, title, value, status) 
select id, 'Enterprise License', 15000, 'proposal' from contacts where phone = '+1-555-0101'
union all
select id, 'Starter Plan', 2500, 'qualified' from contacts where phone = '+1-555-0102'
union all
select id, 'Pro Plan Renewal', 5000, 'negotiation' from contacts where phone = '+1-555-0104'
union all
select id, 'New Partnership', 8000, 'new' from contacts where phone = '+1-555-0105';

insert into tasks (title, description, priority, status, due_date)
values
  ('Follow up with Alice', 'Send proposal document', 'high', 'pending', current_date + interval '1 day'),
  ('Schedule demo for Bob', 'Product demo call', 'medium', 'in_progress', current_date + interval '3 days'),
  ('Review contract', 'Review David''s contract terms', 'high', 'pending', current_date + interval '2 days'),
  ('Send onboarding email', 'Welcome email for Eva', 'low', 'completed', current_date - interval '1 day');
