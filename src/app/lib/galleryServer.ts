import "server-only";
import { getPublicClient, type ArtworkRow } from "./supabase";
import { rowToArtwork } from "./galleryMap";
import { defaultSettings, type Artwork, type GallerySettings } from "../data/artworks";

/**
 * Server-side read for the public gallery's first paint.
 *
 * Uses the anon key: Row Level Security allows SELECT and nothing else, so
 * this never needs the service_role key. Falls back to an empty gallery if
 * Supabase is unreachable rather than failing the whole page.
 */
export async function fetchGallery(): Promise<{
  items: Artwork[];
  settings: GallerySettings;
}> {
  const supabase = getPublicClient();
  if (!supabase) return { items: [], settings: defaultSettings };

  try {
    const [itemsResult, settingsResult] = await Promise.all([
      supabase
        .from("artworks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("gallery_settings")
        .select("eyebrow, heading")
        .eq("id", true)
        .maybeSingle(),
    ]);

    return {
      items: itemsResult.data
        ? (itemsResult.data as ArtworkRow[]).map(rowToArtwork)
        : [],
      settings: (settingsResult.data as GallerySettings | null) ?? defaultSettings,
    };
  } catch {
    return { items: [], settings: defaultSettings };
  }
}
