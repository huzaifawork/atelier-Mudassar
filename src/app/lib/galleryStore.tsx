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
  setStatus: (id: string, status: ArtworkStatus) => Promise<void>;
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

/** Uploads a file and returns the "storage:<path>" reference to save on the item. */
export async function uploadArtworkImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/gallery/upload", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Upload failed"));
  }
  const { image } = (await response.json()) as { image: string };
  return image;
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
        body: JSON.stringify(draft),
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
    async (id: string, status: ArtworkStatus) => {
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
