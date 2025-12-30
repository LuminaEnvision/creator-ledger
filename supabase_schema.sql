-- Users table to store wallet addresses and auth state
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text unique not null,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Public profiles for creators to share their media kit
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text unique references public.users(wallet_address) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  custom_theme jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ledger_entries table with preview fields
create table public.ledger_entries (
  id uuid default gen_random_uuid() primary key,
  wallet_address text references public.users(wallet_address) not null,
  url text not null,
  platform text not null,
  description text,
  campaign_tag text,
  timestamp timestamptz default now() not null,
  payload_hash text not null,
  verification_status text default 'Unverified',
  
  -- Visual preview fields
  title text,
  image_url text,
  custom_image_url text,
  site_name text,

  -- Proof of Ownership
  signature text,

  -- Social Analytics
  stats jsonb default '{"views": 0, "likes": 0, "shares": 0}'::jsonb
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.ledger_entries enable row level security;

-- Policies for public access (MVP simplicity)
create policy "Public read access for users"
  on public.users for select
  using (true);

create policy "Anyone can insert users"
  on public.users for insert
  with check (true);

create policy "Public read access for ledger entries"
  on public.ledger_entries for select
  using (true);

create policy "Anyone can insert ledger entries"
  on public.ledger_entries for insert
  with check (true);

create policy "Allow updates for verification status"
  on public.ledger_entries for update
  using (true)
  with check (true);
