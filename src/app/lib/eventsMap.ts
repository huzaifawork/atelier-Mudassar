import type { Event, EventDraft, EventImage, EventLink } from "../data/events";
import type { EventRow } from "./supabase";
import { STORAGE_PREFIX, isStoredImage, storagePath } from "./galleryMap";

export { STORAGE_PREFIX, isStoredImage, storagePath };

/**
 * Browser-facing URL for an event picture.
 *
 * Same arrangement as the gallery and the journal: bucket objects stream
 * through our own route, so no Supabase storage URL reaches a browser.
 */
export function eventImageSrc(src: string): string {
  if (!isStoredImage(src)) return src;
  return `/api/events/image/${storagePath(src)}`;
}

/** The reference to render: the web-sized copy when there is one. */
export function eventDisplaySrc(picture: EventImage): string {
  return eventImageSrc(picture.displayImage?.trim() || picture.image);
}

/** Width ÷ height, or null when the picture never recorded its size. */
export function eventRatioOf(picture: EventImage): number | null {
  if (picture.width && picture.height) return picture.width / picture.height;
  return null;
}

/**
 * Reads the `images` jsonb back into something typed.
 *
 * The column is jsonb, so Postgres will hand back whatever was written to it.
 * Everything here has been through the admin form, but a malformed or
 * half-migrated row should drop the bad entries rather than crash a page that
 * only wanted to show pictures, so each one is checked and anything without a
 * usable `image` is discarded.
 */
function toImages(value: unknown): EventImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const image = typeof record.image === "string" ? record.image.trim() : "";
    if (!image) return [];
    const displayImage =
      typeof record.displayImage === "string" && record.displayImage.trim()
        ? record.displayImage.trim()
        : undefined;
    const width = typeof record.width === "number" ? record.width : undefined;
    const height = typeof record.height === "number" ? record.height : undefined;
    return [{ image, displayImage, width, height }];
  });
}

/** Same treatment for `links`; an entry with no URL is nothing to show. */
function toLinks(value: unknown): EventLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) return [];
    const label = typeof record.label === "string" ? record.label.trim() : "";
    return [{ label, url }];
  });
}

export function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    body: row.body ?? "",
    eventDate: row.event_date,
    location: row.location ?? undefined,
    images: toImages(row.images),
    links: toLinks(row.links),
    published: row.published,
  };
}

/** Draft → row columns. Images and links are normalised on the way in too, so
 *  nothing unchecked from a request body reaches the column. */
export function eventDraftToRow(draft: EventDraft): Omit<EventRow, "id"> {
  return {
    slug: draft.slug,
    title: draft.title,
    summary: draft.summary ?? "",
    body: draft.body ?? "",
    event_date: draft.eventDate,
    location: draft.location?.trim() ? draft.location.trim() : null,
    images: toImages(draft.images),
    links: toLinks(draft.links),
    published: draft.published,
  };
}

/** Every stored object an event owns, for cleanup when it is deleted or its
 *  pictures are replaced. Bundled paths are not ours to remove. */
export function storedObjectsOf(images: EventImage[]): string[] {
  return images
    .flatMap((picture) => [picture.image, picture.displayImage])
    .filter((ref): ref is string => Boolean(ref) && isStoredImage(ref!))
    .map(storagePath);
}
