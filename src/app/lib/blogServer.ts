import "server-only";
import { getPublicClient, type BlogPostRow } from "./supabase";
import { rowToPost } from "./blogMap";
import type { BlogPost } from "../data/blog";

/**
 * Public reads for /blog and /blog/<slug>.
 *
 * Uses the anon key, so Row Level Security is what actually keeps drafts out —
 * the `published` filters below are for clarity and index use, not the
 * security boundary. Failures degrade to an empty journal rather than a
 * broken page.
 */
export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const supabase = getPublicClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });

    return data ? (data as BlogPostRow[]).map(rowToPost) : [];
  } catch {
    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    return data ? rowToPost(data as BlogPostRow) : null;
  } catch {
    return null;
  }
}
