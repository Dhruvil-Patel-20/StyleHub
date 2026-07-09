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

-- Banners table
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  discount_text text,
  coupon_code text,
  redirect_url text not null default '/products',
  bg_color text default '#4F46E5',
  text_color text default '#ffffff',
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Coupons table
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  type text not null check (type in ('percent', 'fixed', 'free_shipping')),
  value numeric(10,2) not null default 0,
  min_order_value numeric(10,2) default null,
  max_uses integer default null,
  used_count integer default 0,
  max_per_user integer default null,
  one_per_user boolean default false,
  first_order_only boolean default false,
  free_shipping boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references coupons(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  used_amount numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (optional but recommended)
alter table users enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table banners enable row level security;
alter table coupons enable row level security;


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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url text default null;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text default null;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_data jsonb default null;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status text check (return_status in ('requested', 'approved', 'rejected', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested_at timestamptz default null;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz default null;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) default 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_per_user integer default null;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS one_per_user boolean default false;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS first_order_only boolean default false;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_shipping boolean default false;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS coupon_id uuid references coupons(id) on delete cascade;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS user_id uuid references users(id) on delete cascade;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS order_id uuid references orders(id) on delete set null;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS used_amount numeric(10,2) default 0;
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE banners ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS discount_text text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS redirect_url text default '/products';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS bg_color text default '#4F46E5';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_color text default '#ffffff';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active boolean default true;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
