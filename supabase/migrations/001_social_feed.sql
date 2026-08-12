-- Relay social feed foundation
-- Run in the Supabase SQL editor or via supabase db push after linking a project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  wallet_address text primary key check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  display_name text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_address text not null references public.profiles (wallet_address) on delete cascade,
  following_address text not null references public.profiles (wallet_address) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_address, following_address),
  check (follower_address <> following_address)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_address text not null references public.profiles (wallet_address) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists follows_follower_idx on public.follows (follower_address);
create index if not exists follows_following_idx on public.follows (following_address);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;

-- Reads are public for now. Writes go through Next.js API routes that verify
-- wallet signatures and use the service role key.
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "posts are readable by everyone"
  on public.posts for select
  using (true);

create policy "follows are readable by everyone"
  on public.follows for select
  using (true);

-- Demo traders so the feed is not empty on first connect.
insert into public.profiles (wallet_address, display_name, bio)
values
  (
    '0x1111111111111111111111111111111111111111',
    'alpha.eth',
    'Momentum on Robinhood Chain L2. Posts are seeded demo content until on-chain ingestion ships.'
  ),
  (
    '0x2222222222222222222222222222222222222222',
    'flowtrader',
    'Liquidity and range positions. Thesis-first, size second.'
  ),
  (
    '0x3333333333333333333333333333333333333333',
    'quietbid',
    'Patient entries, tight stops. Not financial advice.'
  )
on conflict (wallet_address) do nothing;

insert into public.posts (author_address, body, created_at)
values
  (
    '0x1111111111111111111111111111111111111111',
    'Watching WETH/USDG on the 0.05% pool. Spread tightened after the last mainnet deploy. Waiting for a sweep below prior day low before adding.',
    now() - interval '2 hours'
  ),
  (
    '0x2222222222222222222222222222222222222222',
    'Added liquidity around the current tick on WETH/USDG. Thesis: stablecoin demand on Robinhood Chain picks up as more stock tokens get bridged in.',
    now() - interval '5 hours'
  ),
  (
    '0x3333333333333333333333333333333333333333',
    'Flat until volatility expands. Sharing the setup anyway so the feed reflects how I actually trade, not hindsight PnL screenshots.',
    now() - interval '1 day'
  )
on conflict do nothing;

-- Realtime for live feed updates in the client.
alter publication supabase_realtime add table public.posts;
