/**
 * The Journal — long-form posts the admin writes from /admin/blog.
 *
 * Deliberately separate from the gallery: posts never appear on the landing
 * page, only on /blog and /blog/<slug>.
 */
export interface BlogPost {
  /** Stable identity for admin editing — survives slug/title changes. */
  id: string;
  slug: string;
  title: string;
  /** Short card summary. May be empty, in which case the card falls back to
   *  the opening of `body` (see excerptFor). */
  excerpt: string;
  /** The post itself, plain text. Blank lines separate paragraphs. */
  body: string;
  /** Optional cover. Either a public path or "storage:<path>" into the
   *  private `blog` bucket — resolved by coverSrcFor() in lib/blogMap.ts. */
  coverImage?: string;
  /** Drafts stay out of the public list and return 404 on their own page. */
  published: boolean;
  /** ISO timestamp shown as the post's date. */
  publishedAt: string;
}

export type BlogPostDraft = Omit<BlogPost, "id" | "publishedAt"> & {
  publishedAt?: string;
};

/** Paragraphs for rendering: blank lines split, single newlines kept inside. */
export function paragraphsOf(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/** Card summary: the admin's excerpt, or the start of the body if they left
 *  it blank, so a card is never empty just because a field was skipped. */
export function excerptFor(post: BlogPost, maxLength = 180): string {
  const source = post.excerpt.trim() || post.body.replace(/\s+/g, " ").trim();
  if (source.length <= maxLength) return source;
  const clipped = source.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 60 ? lastSpace : clipped.length).trimEnd()}…`;
}

/** "12 March 2026" — stable across server and client renders, unlike
 *  toLocaleDateString() with no explicit locale. */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Rough reading time, shown as a small piece of card furniture. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
