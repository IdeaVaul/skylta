-- Skylta: grundschema
-- All skrivning sker från servern med secret key (efter inloggningskontroll och
-- plan-gränser). Inloggade användare får bara LÄSA sina egna rader via Data API.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- profiles: en rad per användare, med abonnemangsstatus från Stripe
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  plan text not null default 'none' check (plan in ('none', 'start', 'proffs', 'byra')),
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Användare läser sin egen profil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Skapa profil automatiskt vid registrering. Funktionen ligger i ett schema
-- som inte exponeras via Data API.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- leads: företag som en körning har hittat (byggda eller bortvalda)
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('nils', 'saga')),
  place_id text not null,
  name text not null,
  address text,
  phone text,
  website text,
  rating numeric(2, 1),
  review_count integer,
  status text not null check (status in ('built', 'skipped')),
  skip_reason text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index leads_user_created_idx on public.leads (user_id, created_at desc);

alter table public.leads enable row level security;

create policy "Användare läser sina egna leads"
  on public.leads for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- sites: AI-byggda sajter, visas publikt på /s/<slug> (renderas av servern)
-- ---------------------------------------------------------------------------
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  content jsonb not null,
  outreach_message text not null,
  created_at timestamptz not null default now()
);

create index sites_user_created_idx on public.sites (user_id, created_at desc);
create index sites_lead_idx on public.sites (lead_id);

alter table public.sites enable row level security;

create policy "Användare läser sina egna sajter"
  on public.sites for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- messages: chatthistorik med Nils och Saga
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('nils', 'saga')),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_user_created_idx on public.messages (user_id, created_at desc);

alter table public.messages enable row level security;

create policy "Användare läser sina egna meddelanden"
  on public.messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Rättigheter: bara läsning för inloggade, inget för anon.
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.leads, public.sites, public.messages from anon, authenticated;
grant select on public.profiles, public.leads, public.sites, public.messages to authenticated;
grant all on public.profiles, public.leads, public.sites, public.messages to service_role;

-- Profiler för användare som redan fanns innan triggern skapades
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;
