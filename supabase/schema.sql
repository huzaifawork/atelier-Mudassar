-- Atelier Mudassar — gallery schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run; every statement is guarded.

-- ---------------------------------------------------------------------------
-- Artworks
-- ---------------------------------------------------------------------------
create table if not exists public.artworks (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  year        integer not null,
  medium      text not null default 'Digital Painting',
  category    text not null check (category in ('portrait', 'wildlife', 'landscape')),
  description text not null default '',
  -- Either a bundled demo asset ("/art/x.png") or "storage:<path>" pointing at
  -- the private `artworks` bucket. Served to browsers via /api/gallery/image.
  image       text not null,
  dimensions  text,
  status      text
                check (status is null or status = 'in-progress'),
  youtube_url text,
  details     text[] not null default '{}',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists artworks_sort_order_idx on public.artworks (sort_order, created_at desc);

-- Status is now optional with only 'in-progress' as a meaningful value —
-- 'completed' was retired, so existing rows are migrated to no status at all.
-- These ALTERs are no-ops against a table already created with the definition
-- above, and safe to re-run.
alter table public.artworks alter column status drop default;
alter table public.artworks alter column status drop not null;
alter table public.artworks drop constraint if exists artworks_status_check;
alter table public.artworks add constraint artworks_status_check
  check (status is null or status = 'in-progress');
update public.artworks set status = null where status = 'completed';

-- ---------------------------------------------------------------------------
-- Section-level copy that used to be hardcoded in Gallery.tsx
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_settings (
  id      boolean primary key default true check (id),  -- single-row table
  eyebrow text not null default 'Selected Works',
  heading text not null default 'The Gallery'
);

insert into public.gallery_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Contact form submissions
--
-- Written by POST /api/contact (service_role) and read/managed only from the
-- admin panel. No public policy at all — RLS denies everything to the anon
-- key; the service_role key used server-side bypasses RLS as usual.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  read       boolean not null default false,
  replied_at timestamptz,
  reply_body text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Public visitors may read the gallery and nothing else. All writes go through
-- Next.js route handlers using the service_role key, which bypasses RLS — so
-- there is deliberately no public insert/update/delete policy here. The
-- session/admin-allowlist check lives in those route handlers (guardAdmin()).
-- ---------------------------------------------------------------------------
alter table public.artworks enable row level security;
alter table public.gallery_settings enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "artworks are publicly readable" on public.artworks;
create policy "artworks are publicly readable"
  on public.artworks for select using (true);

drop policy if exists "settings are publicly readable" on public.gallery_settings;
create policy "settings are publicly readable"
  on public.gallery_settings for select using (true);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for admin-uploaded artwork
--
-- Private on purpose. Browsers never receive a Supabase URL; the app streams
-- bytes through its own /api/gallery/image route instead.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artworks_touch_updated_at on public.artworks;
create trigger artworks_touch_updated_at
  before update on public.artworks
  for each row execute function public.touch_updated_at();
