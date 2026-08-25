import type { BlogPost, BlogPostDraft } from "../data/blog";
import type { BlogPostRow } from "./supabase";
import { STORAGE_PREFIX, isStoredImage, storagePath } from "./galleryMap";

export { STORAGE_PREFIX, isStoredImage, storagePath };

/**
 * Browser-facing URL for a cover image.
 *
 * Same arrangement as the gallery: bucket objects are streamed through our own
 * route, so no Supabase storage URL is ever handed to a browser.
 */
export function coverSrcFor(src: string): string {
  if (!isStoredImage(src)) return src;
  return `/api/blog/image/${storagePath(src)}`;
}

export function rowToPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    coverImage: row.cover_image ?? undefined,
    published: row.published,
    publishedAt: row.published_at,
  };
}

export function draftToRow(draft: BlogPostDraft): Omit<BlogPostRow, "id" | "published_at"> &
  Partial<Pick<BlogPostRow, "published_at">> {
  return {
    slug: draft.slug,
    title: draft.title,
    excerpt: draft.excerpt ?? "",
    body: draft.body ?? "",
    cover_image: draft.coverImage?.trim() ? draft.coverImage : null,
    published: draft.published,
    ...(draft.publishedAt ? { published_at: draft.publishedAt } : {}),
  };
}
