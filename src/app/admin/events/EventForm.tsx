"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Event, EventDraft, EventImage, EventLink } from "../../data/events";
import { eventDisplaySrc } from "../../lib/eventsMap";
import { assertUploadableImage } from "../../lib/imageFormats";
import { deleteUnusedImage, uploadImage } from "../../lib/uploadImage";

const UPLOAD_ENDPOINT = "/api/events/upload";

const label = "block text-[0.65rem] tracking-[0.25em] uppercase text-copper mb-2";
const input =
  "w-full bg-espresso border border-gold/20 px-3.5 py-2.5 text-sm text-porcelain placeholder:text-cream-dim/35 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright " +
  "hover:border-gold/40 transition-colors";
const hint = "mt-1.5 text-xs text-cream-dim/70";
const smallButton =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Today as yyyy-mm-dd in local time, for the date input's default. */
function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * A row in the gallery editor.
 *
 * Pictures already on the event and pictures just picked from disk sit in the
 * same ordered list, because the artist reorders and removes them together
 * and the difference only matters at save time. A `file` means it still has
 * to be uploaded; an `uploaded` means it is already in the bucket.
 */
interface GalleryRow {
  /** Stable across reorders, so React keeps the right DOM node. */
  key: string;
  uploaded?: EventImage;
  file?: File;
  /** Object URL for a picked file, revoked when the row goes away. */
  preview?: string;
}

function rowsFrom(images: EventImage[]): GalleryRow[] {
  return images.map((uploaded, index) => ({
    key: `${uploaded.image}-${index}`,
    uploaded,
  }));
}

export default function EventForm({ existing }: { existing?: Event }) {
  const router = useRouter();

  const [draft, setDraft] = useState<EventDraft>(() => {
    if (!existing) {
      return {
        slug: "",
        title: "",
        summary: "",
        body: "",
        eventDate: todayISO(),
        location: "",
        images: [],
        links: [],
        published: true,
      };
    }
    const { id: _id, ...rest } = existing;
    return { ...rest, location: rest.location ?? "" };
  });

  const [rows, setRows] = useState<GalleryRow[]>(() =>
    rowsFrom(existing?.images ?? []),
  );
  const [links, setLinks] = useState<EventLink[]>(() => existing?.links ?? []);
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const slug = slugTouched ? draft.slug : slugify(draft.title);

  // Object URLs are per-row, so they are revoked when the component goes
  // rather than on every rows change, which would kill previews still shown.
  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    const urls = previewsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const onPickFiles = useCallback(async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setError(null);

    const accepted: GalleryRow[] = [];
    for (const file of Array.from(picked)) {
      // Checked as it is chosen, so a wrong format is named against that file
      // rather than failing the whole batch later on.
      try {
        await assertUploadableImage(file);
      } catch (cause) {
        setError(
          `${file.name}: ${cause instanceof Error ? cause.message : "cannot be used."}`,
        );
        continue;
      }
      const preview = URL.createObjectURL(file);
      previewsRef.current.push(preview);
      accepted.push({
        key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        preview,
      });
    }

    if (accepted.length > 0) setRows((current) => [...current, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((current) => current.filter((row) => row.key !== key));
  }, []);

  const moveRow = useCallback((key: string, direction: -1 | 1) => {
    setRows((current) => {
      const index = current.findIndex((row) => row.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const setLink = useCallback(
    (index: number, patch: Partial<EventLink>) => {
      setLinks((current) =>
        current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
      );
    },
    [],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!draft.title.trim()) return setError("Give the event a title.");
    if (!slug.trim()) return setError("A slug is required.");
    if (!draft.eventDate) return setError("Pick a date for the event.");

    const badLink = links.find(
      (link) => link.url.trim() && !/^https?:\/\//i.test(link.url.trim()),
    );
    if (badLink) {
      return setError(
        `"${badLink.label || badLink.url}" must start with http:// or https://`,
      );
    }

    setSaving(true);
    const freshlyUploaded: string[] = [];
    try {
      // Upload in order, so the gallery ends up in the order shown.
      const images: EventImage[] = [];
      for (const row of rows) {
        if (row.uploaded) {
          images.push(row.uploaded);
          continue;
        }
        if (!row.file) continue;
        const uploaded = await uploadImage(row.file, UPLOAD_ENDPOINT);
        freshlyUploaded.push(uploaded.image);
        if (uploaded.displayImage) freshlyUploaded.push(uploaded.displayImage);
        images.push(uploaded);
      }

      const payload: EventDraft = {
        ...draft,
        slug: slug.trim(),
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        body: draft.body.trim(),
        location: draft.location?.trim() || undefined,
        images,
        links: links
          .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
          .filter((link) => link.url),
      };

      const response = await fetch(
        existing ? `/api/events/${existing.id}` : "/api/events",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not save the event.");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (cause) {
      // Pictures uploaded for a save that then failed have nothing pointing
      // at them — drop them rather than leaving them in the bucket forever.
      for (const orphan of freshlyUploaded) {
        void deleteUnusedImage(orphan, UPLOAD_ENDPOINT);
      }
      setError(cause instanceof Error ? cause.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="space-y-5">
        <div>
          <label className={label} htmlFor="title">Title</label>
          <input
            id="title"
            className={input}
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Featured at the Spring Exhibition"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={label} htmlFor="event-date">Date</label>
            <input
              id="event-date"
              type="date"
              className={input}
              value={draft.eventDate.slice(0, 10)}
              onChange={(event) => set("eventDate", event.target.value)}
            />
            <p className={hint}>When it happened, not when you add it here.</p>
          </div>
          <div>
            <label className={label} htmlFor="location">Location</label>
            <input
              id="location"
              className={input}
              value={draft.location ?? ""}
              onChange={(event) => set("location", event.target.value)}
              placeholder="Auckland, New Zealand"
            />
            <p className={hint}>Optional.</p>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="slug">Slug</label>
          <input
            id="slug"
            className={input}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              set("slug", event.target.value);
            }}
            placeholder="spring-exhibition"
          />
          <p className={hint}>The page address: /events/{slug || "…"}</p>
        </div>

        <div>
          <label className={label} htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            rows={3}
            className={`${input} resize-y leading-relaxed`}
            value={draft.summary}
            onChange={(event) => set("summary", event.target.value)}
            placeholder="One or two lines for the card…"
          />
          <p className={hint}>
            Shown on the card. Leave empty and the opening of the description
            is used instead.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="body">Description</label>
          <textarea
            id="body"
            rows={10}
            className={`${input} resize-y leading-relaxed`}
            value={draft.body}
            onChange={(event) => set("body", event.target.value)}
            placeholder="What happened…"
          />
          <p className={hint}>Blank lines separate paragraphs.</p>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Where it was published                                        */}
        {/* ------------------------------------------------------------ */}
        <div className="border-t border-gold/15 pt-5">
          <span className={label}>Published at</span>
          <p className={`${hint} mt-0 mb-3`}>
            Links to where this was covered — an article, an Instagram post, a
            listing. Shown as buttons on the event&rsquo;s page.
          </p>

          <div className="space-y-2.5">
            {links.map((link, index) => (
              <div key={index} className="grid sm:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_auto] gap-2.5">
                <input
                  aria-label={`Link ${index + 1} label`}
                  className={input}
                  value={link.label}
                  onChange={(event) => setLink(index, { label: event.target.value })}
                  placeholder="Instagram"
                />
                <input
                  aria-label={`Link ${index + 1} address`}
                  className={input}
                  value={link.url}
                  onChange={(event) => setLink(index, { url: event.target.value })}
                  placeholder="https://…"
                />
                <button
                  type="button"
                  onClick={() => setLinks((c) => c.filter((_, i) => i !== index))}
                  className={`${smallButton} border-gold/20 text-cream-dim hover:border-copper hover:text-copper`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLinks((c) => [...c, { label: "", url: "" }])}
            className={`${smallButton} mt-3 border-gold/40 text-gold-bright hover:bg-gold hover:text-ink`}
          >
            Add link
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Gallery                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="lg:sticky lg:top-24 space-y-5">
        <div>
          <span className={label}>Photographs</span>
          <p className={`${hint} mt-0 mb-3`}>
            The first one is the cover. Reorder with the arrows.
          </p>

          <div className="space-y-2.5">
            {rows.map((row, index) => {
              const src = row.preview ?? (row.uploaded ? eventDisplaySrc(row.uploaded) : "");
              return (
                <div
                  key={row.key}
                  className="flex items-center gap-3 border border-gold/15 bg-espresso/40 p-2"
                >
                  <div className="relative w-16 h-16 shrink-0 bg-espresso overflow-hidden">
                    {/* Local previews are blob: URLs the optimizer can't
                        fetch, and these are 64px thumbnails either way. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-cream-dim/80 truncate">
                      {index === 0 ? "Cover" : `Photo ${index + 1}`}
                    </p>
                    {row.file && (
                      <p className="text-[0.68rem] text-copper mt-0.5">
                        Uploads on save
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => moveRow(row.key, -1)}
                      disabled={index === 0}
                      aria-label="Move earlier"
                      className={`${smallButton} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(row.key, 1)}
                      disabled={index === rows.length - 1}
                      aria-label="Move later"
                      className={`${smallButton} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      aria-label="Remove"
                      className={`${smallButton} border-gold/20 text-cream-dim hover:border-copper hover:text-copper`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => void onPickFiles(event.target.files)}
            className="sr-only"
            id="event-images"
          />
          <label
            htmlFor="event-images"
            className="mt-3 inline-block cursor-pointer px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            {rows.length > 0 ? "Add more" : "Add photographs"}
          </label>
          <p className={hint}>PNG, JPEG, WebP or AVIF, up to 25 MB each.</p>
        </div>

        <div className="border-t border-gold/15 pt-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => set("published", event.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-xs tracking-[0.2em] uppercase text-cream-dim">
              Published
            </span>
          </label>
          <p className={hint}>
            Unpublished events are hidden from the site entirely.
          </p>
        </div>

        {error && (
          <p className="border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-gold/15 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Add event"}
          </button>
          <Link
            href="/admin/events"
            className="px-6 py-3 text-xs tracking-[0.2em] uppercase border border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
