import type { Artwork, ArtworkDraft, Category, ArtworkStatus } from "../data/artworks";
import type { ArtworkRow } from "./supabase";

export const STORAGE_PREFIX = "storage:";

/** True for images held in the private Supabase bucket (vs. a bundled demo asset). */
export function isStoredImage(src: string): boolean {
  return src.startsWith(STORAGE_PREFIX);
}

export function storagePath(src: string): string {
  return src.slice(STORAGE_PREFIX.length);
}

/**
 * Browser-facing URL for an artwork image.
 *
 * Bucket images are streamed through our own route rather than a Supabase URL,
 * so no direct storage link is ever exposed. The path starts with "/" so
 * next/image still optimises it.
 */
export function imageSrcFor(src: string): string {
  if (!isStoredImage(src)) return src;
  return `/api/gallery/image/${storagePath(src)}`;
}

export function rowToArtwork(row: ArtworkRow): Artwork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year,
    medium: row.medium,
    category: row.category as Category,
    description: row.description,
    image: row.image,
    dimensions: row.dimensions ?? undefined,
    status: (row.status as ArtworkStatus | null) ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    details: row.details && row.details.length > 0 ? row.details : undefined,
  };
}

/** Draft → row columns. `sort_order` is managed separately by the reorder API. */
export function draftToRow(draft: ArtworkDraft): Omit<ArtworkRow, "id" | "sort_order"> {
  return {
    slug: draft.slug,
    title: draft.title,
    year: draft.year,
    medium: draft.medium,
    category: draft.category,
    description: draft.description,
    image: draft.image,
    dimensions: draft.dimensions ?? null,
    status: draft.status ?? null,
    youtube_url: draft.youtubeUrl ?? null,
    details: draft.details ?? [],
  };
}
