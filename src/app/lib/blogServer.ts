import "server-only";
import { getPublicClient, type BlogPostRow } from "./supabase";
import { rowToPost } from "./blogMap";
import { slugify, type BlogPost } from "../data/blog";

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
    const raw = decodeURIComponent(slug ?? "").trim();
    const candidates = Array.from(
      new Set(
        [slug, raw, slugify(slug), slugify(raw)]
          .map((candidate) => candidate?.trim())
          .filter((candidate): candidate is string => Boolean(candidate && candidate.length > 0)),
      ),
    );

    for (const candidate of candidates) {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", candidate)
        .eq("published", true)
        .maybeSingle();

      if (data) return rowToPost(data as BlogPostRow);
    }

    return null;
  } catch {
    return null;
  }
}
