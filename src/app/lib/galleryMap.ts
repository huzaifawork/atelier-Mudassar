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

/** Shape of a card with no better information — matches the portrait bias of
 *  the seed collection, so an unknown image reserves a plausible box. */
export const DEFAULT_RATIO = 3 / 4;

/** Best-effort parse of an admin-entered "907 × 1215 px" string. Only a
 *  fallback: artwork added since the real pixel size started being recorded
 *  carries imageWidth/imageHeight, which needs no guessing. */
export function parseRatio(dimensions?: string): number | null {
  if (!dimensions) return null;
  const match = dimensions.match(/([\d.]+)\s*[×x]\s*([\d.]+)/i);
  if (!match) return null;
  const w = parseFloat(match[1]);
  const h = parseFloat(match[2]);
  if (!w || !h) return null;
  return w / h;
}

/**
 * Width ÷ height for an artwork, or null when nothing on the record says.
 *
 * This is what lets the gallery show a piece in its own shape instead of
 * forcing everything into one portrait box. Recorded pixels win; the
 * free-text dimensions are a fallback for older rows; and a null answer
 * means the caller should start from DEFAULT_RATIO and correct itself when
 * the image reports its real size on load.
 */
export function ratioOf(
  artwork: Pick<Artwork, "imageWidth" | "imageHeight" | "dimensions">,
): number | null {
  const { imageWidth, imageHeight } = artwork;
  if (imageWidth && imageHeight) return imageWidth / imageHeight;
  return parseRatio(artwork.dimensions);
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
    imageWidth: row.image_width ?? undefined,
    imageHeight: row.image_height ?? undefined,
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
    image_width: draft.imageWidth ?? null,
    image_height: draft.imageHeight ?? null,
    status: draft.status ?? null,
    youtube_url: draft.youtubeUrl ?? null,
    details: draft.details ?? [],
  };
}
