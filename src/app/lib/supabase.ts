import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const ARTWORK_BUCKET = "artworks";

/** True when the environment is wired up; lets callers fall back to seed data
 *  instead of throwing during local work without credentials. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** Read-only client bound to the anon key. Row Level Security limits this to
 *  SELECT on the gallery tables, so it is safe in any server context. */
export function getPublicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Full-access client bound to the service_role key — bypasses RLS.
 *
 * SERVER ONLY. Never import this into a "use client" module: the key must not
 * reach a browser bundle. Every admin write goes through a route handler that
 * uses this, gated by guardAdmin() (see lib/adminGuard.ts) before any query runs.
 */
export function getServiceClient(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Raw Storage REST base + service key, for the one operation supabase-js
 * doesn't expose: reading only the first few bytes of an object with a Range
 * header. `download()` would pull the whole file, which for a 25 MB artwork is
 * a lot of bandwidth to spend confirming twelve bytes.
 *
 * SERVER ONLY, for the same reason as getServiceClient().
 */
export function getStorageRest(): { url: string; key: string } | null {
  if (!url || !serviceRoleKey) return null;
  return { url: `${url}/storage/v1`, key: serviceRoleKey };
}

/**
 * True when Postgres rejected a write because a column doesn't exist
 * (undefined_column, 42703).
 *
 * In practice that means the app was deployed with a schema change that
 * hasn't been applied yet — supabase/schema.sql needs re-running. Worth
 * naming specifically, because the generic "Could not save" it would
 * otherwise produce sends you looking at the wrong thing entirely.
 */
export function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

/** Row shape as stored in Postgres (snake_case). */
export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  replied_at: string | null;
  reply_body: string | null;
  created_at: string;
}

/** Row shape as stored in Postgres (snake_case). */
export interface ArtworkRow {
  id: string;
  slug: string;
  title: string;
  year: number;
  medium: string;
  category: string;
  description: string;
  image: string;
  dimensions: string | null;
  image_width: number | null;
  image_height: number | null;
  display_image: string | null;
  status: string | null;
  youtube_url: string | null;
  details: string[] | null;
  sort_order: number;
}

export const BLOG_BUCKET = "blog";

/** Row shape as stored in Postgres (snake_case). */
export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: boolean;
  published_at: string;
}
