-- =============================================
-- StyleHub E-Commerce - Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  role text not null default 'client' check (role in ('client', 'seller', 'admin')),
  wishlist uuid[] default '{}',
  created_at timestamptz default now()
);

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  category text not null check (category in ('men', 'women', 'kids', 'footwear', 'jewelry', 'accessories', 'sportswear', 'beauty')),
  sub_category text,
  images text[] default '{}',
  sizes text[] default '{}',
  colors text[] default '{}',
  stock integer default 0,
  original_price numeric(10,2) default null,
  rating numeric(3,2) default 0,
  num_reviews integer default 0,
  featured boolean default false,
  seller_id uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);

-- Orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  items jsonb not null,
  shipping_address jsonb not null,
  payment_method text default 'stripe',
  payment_result jsonb,
  total_price numeric(10,2) not null,
  is_paid boolean default false,
  paid_at timestamptz,
  is_delivered boolean default false,
  delivered_at timestamptz,
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz default now()
);

-- Enable Row Level Security (optional but recommended)
alter table users enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public can read products" on products;
drop policy if exists "Public can read reviews" on reviews;

-- Public read access for products and reviews
create policy "Public can read products" on products for select using (true);
create policy "Public can read reviews" on reviews for select using (true);

-- Service role bypasses RLS (our backend uses service role key, so all operations work)

-- =============================================
-- MIGRATION: Run if table already exists
-- =============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id uuid references users(id) on delete cascade;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price numeric(10,2) default null;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method text default 'standard';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_returnable boolean default true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_window_days integer default 7;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy_note text default null;
