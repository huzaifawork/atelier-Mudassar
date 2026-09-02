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
-- above, and safe to re-run. The data migration runs before the new
-- constraint is added, since the constraint validates existing rows
-- immediately and would otherwise reject any row that isn't null or
-- 'in-progress' — matched broadly (not just literal 'completed') so any
-- other leftover value can't make this ALTER fail the same way again.
alter table public.artworks alter column status drop default;
alter table public.artworks alter column status drop not null;
update public.artworks set status = null where status is not null and status <> 'in-progress';
alter table public.artworks drop constraint if exists artworks_status_check;
alter table public.artworks add constraint artworks_status_check
  check (status is null or status = 'in-progress');

-- The source file's real pixel size, captured in the browser when the artwork
-- is picked. The gallery reserves each card at the artwork's own shape from
-- this, so a landscape or square piece is shown as it is rather than
-- letterboxed inside a portrait box. Null on rows added before this existed —
-- the grid falls back to the `dimensions` text, then to the image's decoded
-- size once it loads.
alter table public.artworks add column if not exists image_width  integer;
alter table public.artworks add column if not exists image_height integer;

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

-- Artwork is uploaded straight from the admin's browser on a signed URL, so
-- the app's own function never sees the bytes and can't measure or sniff them
-- on the way past. (It can't take the upload itself: a Vercel function's
-- request body is capped at 4.5 MB, well under a full-resolution export, and
-- the platform rejects anything larger with a 413.) These two limits are
-- therefore the real enforcement of "25 MB, and only these four formats" —
-- Supabase applies them when the bytes arrive, whatever the client claimed.
-- The magic-byte check still happens, just afterwards: see handleUploadVerify.
update storage.buckets
set file_size_limit = 26214400,  -- 25 MB, matching MAX_BYTES in lib/imageFormats.ts
    allowed_mime_types = array[
      'image/png', 'image/jpeg', 'image/webp', 'image/avif'
    ]
where id = 'artworks';

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

-- ---------------------------------------------------------------------------
-- Blog posts (the "Journal")
--
-- Lives on its own /blog page — deliberately not part of the landing page.
-- Only published posts are publicly readable; drafts stay admin-only, which is
-- enforced by the RLS policy below rather than by the query that reads them.
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  -- Short card summary. Optional: falls back to the opening of `body`.
  excerpt      text not null default '',
  -- The post itself, plain text. Blank lines separate paragraphs; rendered as
  -- text nodes (never HTML), so nothing an admin types can inject markup.
  body         text not null default '',
  -- Optional. Null when the post has no cover; otherwise "storage:<path>"
  -- into the private `blog` bucket, served via /api/blog/image.
  cover_image  text,
  published    boolean not null default true,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "published posts are publicly readable" on public.blog_posts;
create policy "published posts are publicly readable"
  on public.blog_posts for select using (published);

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- Private bucket for blog cover images, mirroring `artworks`. Browsers never
-- see a Supabase URL; bytes are streamed through /api/blog/image.
insert into storage.buckets (id, name, public)
values ('blog', 'blog', false)
on conflict (id) do nothing;
