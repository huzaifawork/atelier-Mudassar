"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  defaultSettings,
  type Artwork,
  type ArtworkDraft,
  type ArtworkStatus,
  type GallerySettings,
} from "../data/artworks";
import { assertUploadableImage, createDisplayImage } from "./imageFormats";

interface GalleryContextValue {
  items: Artwork[];
  settings: GallerySettings;
  /** False until the first load resolves; admin screens wait on this so they
   *  never flash "not found" against data that hasn't arrived. */
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getItem: (id: string) => Artwork | undefined;
  addItem: (draft: ArtworkDraft) => Promise<Artwork>;
  updateItem: (id: string, draft: Partial<ArtworkDraft>) => Promise<Artwork>;
  deleteItem: (id: string) => Promise<void>;
  setStatus: (id: string, status: ArtworkStatus | undefined) => Promise<void>;
  reorderItem: (id: string, direction: -1 | 1) => Promise<void>;
  updateSettings: (next: GallerySettings) => Promise<void>;
  seedDemoItems: () => Promise<number>;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Puts one blob in the artworks bucket and returns its "storage:<path>" ref.
 *
 * The bytes go straight from this browser to Supabase Storage, not through
 * /api/gallery/upload. That route runs as a Vercel function, and a Vercel
 * function's request body is capped at 4.5 MB — the platform answers anything
 * larger with a bare 413 before our handler ever runs, which is what used to
 * make every real artwork export fail with a generic "Upload failed". So the
 * route only signs the upload and checks it afterwards; the transfer itself
 * bypasses it entirely.
 */
async function putInBucket(body: Blob, contentType: string): Promise<string> {
  const signed = await fetch("/api/gallery/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: body.size }),
  });
  if (!signed.ok) {
    throw new Error(await readError(signed, "Upload failed"));
  }
  const { bucket, path, token, image } = (await signed.json()) as {
    bucket: string;
    path: string;
    token: string;
    image: string;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Uploads are not configured.");
  }

  // Imported on demand: this module is in the public gallery's bundle too, and
  // only an admin picking a file ever needs the storage client.
  const { createClient } = await import("@supabase/supabase-js");
  const storage = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  }).storage.from(bucket);

  const { error } = await storage.uploadToSignedUrl(path, token, body, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error("Could not upload the image. Check your connection and try again.");
  }

  // The server never saw these bytes, so let it read the first few back and
  // confirm the file is what it said it was. A failure here has already
  // removed the object server-side; the extra cleanup covers the other cases.
  const verified = await fetch("/api/gallery/upload", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, contentType }),
  });
  if (!verified.ok) {
    void deleteUnusedArtworkImage(image);
    throw new Error(await readError(verified, "Upload failed"));
  }

  return image;
}

/**
 * Uploads an artwork: the original, plus the web-sized copy visitors get.
 *
 * Both are stored. `image` is the untouched export and stays the artist's
 * master; `displayImage` is what the site renders. Without the second one the
 * image optimizer has to pull a full 40-to-140-megapixel export through a
 * function every time it needs a size it hasn't cached — which is what made
 * the gallery slow to paint.
 *
 * The derivative is best-effort. If the browser can't decode the file (a very
 * large export can exhaust memory) or the encode gains nothing, it is simply
 * omitted and the original is served: slower for that one piece, never broken.
 */
export async function uploadArtworkImage(
  file: File,
): Promise<{ image: string; displayImage?: string }> {
  // Cheap local checks first, so an unusable file is rejected with a specific
  // reason before a single byte goes over the wire.
  await assertUploadableImage(file);

  const image = await putInBucket(file, file.type);

  let displayImage: string | undefined;
  try {
    const display = await createDisplayImage(file);
    if (display) displayImage = await putInBucket(display, "image/webp");
  } catch {
    displayImage = undefined;
  }

  return { image, displayImage };
}

/** Best-effort cleanup for an upload that was never attached to a saved artwork. */
export async function deleteUnusedArtworkImage(image: string): Promise<void> {
  try {
    await fetch("/api/gallery/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
  } catch {
    // Best-effort — a failed cleanup just leaves one orphaned object, which
    // is the exact status quo this exists to reduce, not a new failure mode.
  }
}

export function GalleryProvider({
  children,
  initialItems = [],
  initialSettings = defaultSettings,
}: {
  children: React.ReactNode;
  /** Server-rendered first paint, so the public gallery isn't empty on load. */
  initialItems?: Artwork[];
  initialSettings?: GallerySettings;
}) {
  const [items, setItems] = useState<Artwork[]>(initialItems);
  const [settings, setSettings] = useState<GallerySettings>(initialSettings);
  const [loaded, setLoaded] = useState(initialItems.length > 0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [itemsResponse, settingsResponse] = await Promise.all([
        fetch("/api/gallery/items", { cache: "no-store" }),
        fetch("/api/gallery/settings", { cache: "no-store" }),
      ]);

      if (!itemsResponse.ok) {
        throw new Error(await readError(itemsResponse, "Could not load gallery"));
      }

      const { items: nextItems } = (await itemsResponse.json()) as {
        items: Artwork[];
      };
      setItems(nextItems);

      if (settingsResponse.ok) {
        const { settings: nextSettings } = (await settingsResponse.json()) as {
          settings: GallerySettings;
        };
        setSettings(nextSettings);
      }
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load gallery");
    } finally {
      setLoaded(true);
    }
  }, []);

  // The public page hands us server-rendered data, so skip the redundant
  // client fetch there; admin screens mount with nothing and do load.
  const hasServerData = useRef(initialItems.length > 0);
  useEffect(() => {
    if (hasServerData.current) {
      hasServerData.current = false;
      return;
    }
    void refresh();
  }, [refresh]);

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items],
  );

  const addItem = useCallback(async (draft: ArtworkDraft) => {
    const response = await fetch("/api/gallery/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not save artwork"));
    }
    const { item } = (await response.json()) as { item: Artwork };
    setItems((current) => [item, ...current]);
    return item;
  }, []);

  const updateItem = useCallback(
    async (id: string, draft: Partial<ArtworkDraft>) => {
      const response = await fetch(`/api/gallery/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // A field explicitly set to `undefined` (e.g. "clear the YouTube
        // link") means something different from a field never mentioned at
        // all (leave it alone). JSON.stringify normally can't tell those
        // apart — both drop the key — so map undefined to null here, which
        // *does* survive serialization, and the PATCH route treats an
        // explicit null as "clear this field".
        body: JSON.stringify(draft, (_key, value) =>
          value === undefined ? null : value,
        ),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Could not update artwork"));
      }
      const { item } = (await response.json()) as { item: Artwork };
      setItems((current) =>
        current.map((existing) => (existing.id === id ? item : existing)),
      );
      return item;
    },
    [],
  );

  const deleteItem = useCallback(async (id: string) => {
    const response = await fetch(`/api/gallery/items/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not delete artwork"));
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const setStatus = useCallback(
    async (id: string, status: ArtworkStatus | undefined) => {
      await updateItem(id, { status });
    },
    [updateItem],
  );

  const reorderItem = useCallback(
    async (id: string, direction: -1 | 1) => {
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= items.length) return;

      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      setItems(next);

      const response = await fetch("/api/gallery/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      if (!response.ok) {
        setItems(items); // Put the old order back if the write failed.
        throw new Error(await readError(response, "Could not reorder gallery"));
      }
    },
    [items],
  );

  const updateSettings = useCallback(async (next: GallerySettings) => {
    const response = await fetch("/api/gallery/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not save settings"));
    }
    const { settings: saved } = (await response.json()) as {
      settings: GallerySettings;
    };
    setSettings(saved);
  }, []);

  const seedDemoItems = useCallback(async () => {
    const response = await fetch("/api/gallery/seed", { method: "POST" });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not add demo artworks"));
    }
    const { inserted } = (await response.json()) as { inserted: number };
    await refresh();
    return inserted;
  }, [refresh]);

  const value = useMemo<GalleryContextValue>(
    () => ({
      items,
      settings,
      loaded,
      error,
      refresh,
      getItem,
      addItem,
      updateItem,
      deleteItem,
      setStatus,
      reorderItem,
      updateSettings,
      seedDemoItems,
    }),
    [
      items,
      settings,
      loaded,
      error,
      refresh,
      getItem,
      addItem,
      updateItem,
      deleteItem,
      setStatus,
      reorderItem,
      updateSettings,
      seedDemoItems,
    ],
  );

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
}

export function useGallery(): GalleryContextValue {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used inside <GalleryProvider>");
  }
  return context;
}
