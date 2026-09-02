"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  categoryLabels,
  categoryOrder,
  statusLabels,
  statusOrder,
  type Artwork,
  type ArtworkDraft,
  type ArtworkStatus,
  type Category,
} from "../../data/artworks";
import { useGallery, uploadArtworkImage, deleteUnusedArtworkImage } from "../../lib/galleryStore";
import { imageSrcFor } from "../../lib/galleryMap";
import { assertUploadableImage } from "../../lib/imageFormats";
import { extractVideoId, thumbnailFor } from "../../lib/youtube";
import PreviewModal from "./PreviewModal";

const label = "block text-[0.65rem] tracking-[0.25em] uppercase text-copper mb-2";
const input =
  "w-full bg-espresso border border-gold/20 px-3.5 py-2.5 text-sm text-porcelain placeholder:text-cream-dim/35 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright " +
  "hover:border-gold/40 transition-colors";
const hint = "mt-1.5 text-xs text-cream-dim/70";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyDraft(): ArtworkDraft {
  return {
    slug: "",
    title: "",
    year: new Date().getFullYear(),
    medium: "Digital Painting",
    category: "portrait",
    description: "",
    image: "",
    dimensions: "",
    status: undefined,
    youtubeUrl: "",
    details: [],
  };
}

export default function ArtworkForm({ existing }: { existing?: Artwork }) {
  const router = useRouter();
  const { addItem, updateItem, items } = useGallery();

  const [draft, setDraft] = useState<ArtworkDraft>(() => {
    if (!existing) return emptyDraft();
    const { id: _id, ...rest } = existing;
    return { ...rest, dimensions: rest.dimensions ?? "", youtubeUrl: rest.youtubeUrl ?? "" };
  });
  const [detailsText, setDetailsText] = useState(
    (existing?.details ?? []).join("\n"),
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof ArtworkDraft>(key: K, value: ArtworkDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  // Derived rather than synced in an effect: the slug simply tracks the title
  // until the admin types their own, which avoids a cascading render.
  const slug = slugTouched ? draft.slug : slugify(draft.title);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onPickFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);

      // Check the file the moment it's chosen rather than on submit, so a
      // wrong format or an oversized export is named right away instead of
      // after the artist has filled the whole form in.
      try {
        await assertUploadableImage(file);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That file can't be used.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (localPreview) URL.revokeObjectURL(localPreview);

      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setLocalPreview(url);
    },
    [localPreview],
  );

  const clearImage = useCallback(() => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setPendingFile(null);
    set("image", "");
    set("dimensions", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [localPreview, set]);

  const videoId = draft.youtubeUrl ? extractVideoId(draft.youtubeUrl) : null;
  const videoInvalid = Boolean(draft.youtubeUrl?.trim()) && !videoId;
  const shownImage = localPreview ?? (draft.image ? imageSrcFor(draft.image) : null);

  // Everything the preview needs, including the not-yet-uploaded local file.
  const previewArtwork: Artwork = {
    ...draft,
    slug,
    id: existing?.id ?? "preview",
    details: detailsText.split("\n").map((line) => line.trim()).filter(Boolean),
    youtubeUrl: videoId ? draft.youtubeUrl : undefined,
    dimensions: draft.dimensions || undefined,
    image: localPreview ?? draft.image,
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!draft.title.trim()) return setError("Give the artwork a title.");
    if (!slug.trim()) return setError("A slug is required.");
    if (!pendingFile && !draft.image) return setError("Upload an image.");
    if (videoInvalid) return setError("That doesn't look like a YouTube link.");

    const clash = items.find(
      (item) => item.slug === slug.trim() && item.id !== existing?.id,
    );
    if (clash) return setError(`"${clash.title}" already uses that slug.`);

    setSaving(true);
    let freshlyUploaded: string | null = null;
    try {
      let image = draft.image;
      if (pendingFile) {
        image = await uploadArtworkImage(pendingFile);
        freshlyUploaded = image;
      }

      const payload: ArtworkDraft = {
        ...draft,
        image,
        slug: slug.trim(),
        title: draft.title.trim(),
        medium: draft.medium.trim() || "Digital Painting",
        dimensions: draft.dimensions?.trim() || undefined,
        youtubeUrl: videoId ? draft.youtubeUrl!.trim() : undefined,
        details: detailsText.split("\n").map((line) => line.trim()).filter(Boolean),
      };

      if (existing) await updateItem(existing.id, payload);
      else await addItem(payload);

      router.push("/admin/gallery");
    } catch (cause) {
      // The image upload itself succeeded but the save referencing it
      // (e.g. a slug conflict) didn't — remove the now-orphaned object
      // rather than leaving it in the bucket with nothing pointing at it.
      if (freshlyUploaded) void deleteUnusedArtworkImage(freshlyUploaded);
      setError(cause instanceof Error ? cause.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* Image                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:sticky lg:top-24">
          <span className={label}>Artwork image</span>
          <div className="relative aspect-3/4 w-full bg-espresso border border-gold/20 overflow-hidden flex items-center justify-center">
            {shownImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shownImage}
                alt="Selected artwork"
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-cream-dim/60 text-xs tracking-[0.2em] uppercase px-6 text-center">
                No image selected
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => void onPickFile(event.target.files?.[0] ?? null)}
            className="sr-only"
            id="artwork-image"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <label
              htmlFor="artwork-image"
              className="cursor-pointer px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
            >
              {shownImage ? "Replace" : "Upload"}
            </label>
            {shownImage && (
              <button
                type="button"
                onClick={clearImage}
                className="px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/20 text-cream-dim hover:border-copper hover:text-copper transition-colors"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              disabled={!shownImage}
              className="px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Preview
            </button>
          </div>
          <p className={hint}>
            PNG, JPEG, WebP or AVIF, up to 25 MB. Shown to visitors exactly as
            uploaded.
          </p>

          {/* Mirrors the card's "2026 · Portraits" line so the admin can see
              the label combination before saving. */}
          <div className="mt-6 border-t border-gold/15 pt-4">
            <span className={label}>Appears on the card as</span>
            <p className="font-display text-lg text-porcelain">
              {draft.title || "Untitled"}
            </p>
            <p className="text-copper text-xs tracking-[0.2em] uppercase mt-1">
              {draft.year} · {categoryLabels[draft.category]}
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Fields                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-5">
          <div>
            <label className={label} htmlFor="title">Title</label>
            <input
              id="title"
              className={input}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Robert"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="year">Year</label>
              <input
                id="year"
                type="number"
                className={input}
                value={draft.year}
                onChange={(event) => set("year", Number(event.target.value) || 0)}
              />
            </div>
            <div>
              <label className={label} htmlFor="category">Category</label>
              <select
                id="category"
                className={input}
                value={draft.category}
                onChange={(event) => set("category", event.target.value as Category)}
              >
                {categoryOrder.map((key) => (
                  <option key={key} value={key}>
                    {categoryLabels[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="medium">Medium</label>
              <input
                id="medium"
                className={input}
                value={draft.medium}
                onChange={(event) => set("medium", event.target.value)}
                placeholder="Digital Painting"
              />
            </div>
            <div>
              <label className={label} htmlFor="status">Status</label>
              <select
                id="status"
                className={input}
                value={draft.status ?? ""}
                onChange={(event) =>
                  set(
                    "status",
                    event.target.value === ""
                      ? undefined
                      : (event.target.value as ArtworkStatus),
                  )
                }
              >
                <option value="">No status</option>
                {statusOrder.map((key) => (
                  <option key={key} value={key}>
                    {statusLabels[key]}
                  </option>
                ))}
              </select>
              <p className={hint}>Optional. Leave as &ldquo;No status&rdquo; to show no badge.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="dimensions">Dimensions</label>
              <input
                id="dimensions"
                className={input}
                value={draft.dimensions ?? ""}
                onChange={(event) => set("dimensions", event.target.value)}
                placeholder="907 × 1215 px"
              />
              <p className={hint}>Enter the artwork&rsquo;s dimensions yourself, e.g. 907 × 1215 px.</p>
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
                placeholder="robert"
              />
              <p className={hint}>Used internally; must be unique.</p>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={5}
              className={`${input} resize-y leading-relaxed`}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="What the piece explores…"
            />
          </div>

          <div>
            <label className={label} htmlFor="details">Additional details</label>
            <textarea
              id="details"
              rows={3}
              className={`${input} resize-y leading-relaxed`}
              value={detailsText}
              onChange={(event) => setDetailsText(event.target.value)}
              placeholder={"Commissioned work\nPrivate collection"}
            />
            <p className={hint}>
              One per line. Shown as a bullet list; hidden entirely when empty.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="youtube">Related YouTube video</label>
            <input
              id="youtube"
              className={input}
              value={draft.youtubeUrl ?? ""}
              onChange={(event) => set("youtubeUrl", event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            {videoInvalid ? (
              <p className="mt-1.5 text-xs text-copper">
                Not a recognised YouTube link.
              </p>
            ) : videoId ? (
              <div className="mt-3 flex items-center gap-3 border border-gold/20 bg-espresso p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailFor(videoId)}
                  alt=""
                  className="w-24 aspect-video object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs text-gold-bright tracking-[0.15em] uppercase">
                    Video linked
                  </p>
                  <p className={`${hint} truncate`}>{videoId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("youtubeUrl", "")}
                  className="ml-auto shrink-0 px-3 py-1.5 text-[0.65rem] tracking-[0.2em] uppercase border border-gold/20 text-cream-dim hover:border-copper hover:text-copper transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className={hint}>
                Optional. Leave empty and no video section is shown.
              </p>
            )}
          </div>

          {error && (
            <p className="border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gold/15">
            <button
              type="submit"
              disabled={saving}
              className="mt-5 px-6 py-3 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : existing ? "Save changes" : "Add to gallery"}
            </button>
            <Link
              href="/admin/gallery"
              className="mt-5 px-6 py-3 text-xs tracking-[0.2em] uppercase border border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {previewing && (
        <PreviewModal artwork={previewArtwork} onClose={() => setPreviewing(false)} />
      )}
    </>
  );
}
