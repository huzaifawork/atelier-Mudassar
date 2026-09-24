/**
 * Events — exhibitions, features and press, listed alongside the Journal.
 *
 * Where a journal post is mostly writing, an event is mostly pictures and
 * links: what happened, and where it was written up afterwards.
 */

/** One picture in an event's gallery. */
export interface EventImage {
  /** The untouched upload. Kept as the record. */
  image: string;
  /** Web-sized copy actually served; absent if the encode was skipped. */
  displayImage?: string;
  /** Real pixel size, so a card reserves the right shape before it loads. */
  width?: number;
  height?: number;
}

/** Somewhere this event was published — an article, a post, a listing. */
export interface EventLink {
  label: string;
  url: string;
}

export interface Event {
  /** Stable identity for admin editing — survives slug/title changes. */
  id: string;
  slug: string;
  title: string;
  /** Card summary. May be empty; excerptForEvent falls back to the body. */
  summary: string;
  /** Plain text. Blank lines separate paragraphs. */
  body: string;
  /** When the event happened — not when the entry was written. */
  eventDate: string;
  location?: string;
  /** Ordered. The first is the cover, so there is no separate cover field. */
  images: EventImage[];
  links: EventLink[];
  /** Unpublished events stay out of the public list and 404 on their page. */
  published: boolean;
}

export type EventDraft = Omit<Event, "id">;

/** The cover: simply the first picture, or nothing if none were added. */
export function coverOf(event: Event): EventImage | undefined {
  return event.images[0];
}

/** Card summary: the admin's own, or the start of the body when they left it
 *  blank, so a card is never empty just because a field was skipped. */
export function excerptForEvent(event: Event, maxLength = 180): string {
  const source = event.summary.trim() || event.body.replace(/\s+/g, " ").trim();
  if (source.length <= maxLength) return source;
  const clipped = source.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 60 ? lastSpace : clipped.length).trimEnd()}…`;
}

/** "12 March 2026" — an explicit locale, so the server and the client agree.
 *  A bare date has no timezone, so it is read as UTC to stop the day sliding
 *  backwards for anyone west of Greenwich. */
export function formatEventDate(date: string): string {
  const value = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Paragraphs for rendering: blank lines split, single newlines kept inside. */
export function paragraphsOfEvent(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/**
 * The hostname of a link, used as a fallback label.
 *
 * An admin pasting a URL without naming it should still get something
 * readable on the button rather than the raw address.
 */
export function labelForLink(link: EventLink): string {
  if (link.label.trim()) return link.label.trim();
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

/**
 * True for a URL safe to put in an href.
 *
 * Only http(s): an admin-entered "javascript:" or "data:" URL would otherwise
 * become a script that runs when a visitor clicks it.
 */
export function isSafeLinkUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
