"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatPostDate,
  paragraphsOf,
  readingMinutes,
  type BlogPost,
  type BlogPostDraft,
} from "../../data/blog";
import { coverSrcFor } from "../../lib/blogMap";

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

/** Uploads a cover and returns the "storage:<path>" reference to save on the post. */
async function uploadCover(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/blog/upload", { method: "POST", body: form });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed");
  }
  const { image } = (await response.json()) as { image: string };
  return image;
}

/** Best-effort cleanup for a cover that was never attached to a saved post. */
async function deleteUnusedCover(image: string): Promise<void> {
  try {
    await fetch("/api/blog/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
  } catch {
    // Best-effort — a failed cleanup just leaves one orphaned object, which is
    // the exact status quo this exists to reduce, not a new failure mode.
  }
}

function emptyDraft(): BlogPostDraft {
  return {
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverImage: undefined,
    published: true,
  };
}

export default function BlogForm({ existing }: { existing?: BlogPost }) {
  const router = useRouter();

  const [draft, setDraft] = useState<BlogPostDraft>(() =>
    existing
      ? {
          slug: existing.slug,
          title: existing.title,
          excerpt: existing.excerpt,
          body: existing.body,
          coverImage: existing.coverImage,
          published: existing.published,
        }
      : emptyDraft(),
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof BlogPostDraft>(key: K, value: BlogPostDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  // Derived rather than synced in an effect: the slug simply tracks the title
  // until the admin types their own, which avoids a cascading render.
  const slug = slugTouched ? draft.slug : slugify(draft.title);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onPickFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      setError(null);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setPendingFile(file);
      setLocalPreview(URL.createObjectURL(file));
    },
    [localPreview],
  );

  const clearCover = useCallback(() => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setPendingFile(null);
    set("coverImage", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [localPreview, set]);

  const shownCover =
    localPreview ?? (draft.coverImage ? coverSrcFor(draft.coverImage) : null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!draft.title.trim()) return setError("Give the post a title.");
    if (!slug.trim()) return setError("A slug is required.");
    if (!draft.body.trim()) return setError("Write something in the post.");

    setSaving(true);
    let freshlyUploaded: string | null = null;
    try {
      let coverImage = draft.coverImage;
      if (pendingFile) {
        coverImage = await uploadCover(pendingFile);
        freshlyUploaded = coverImage;
      }

      const payload: BlogPostDraft = {
        ...draft,
        coverImage,
        slug: slug.trim(),
        title: draft.title.trim(),
        excerpt: draft.excerpt.trim(),
        body: draft.body.trim(),
      };

      const response = await fetch(
        existing ? `/api/blog/posts/${existing.id}` : "/api/blog/posts",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not save the post.");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (cause) {
      // The cover upload itself succeeded but the save referencing it (e.g. a
      // slug conflict) didn't — remove the now-orphaned object rather than
      // leaving it in the bucket with nothing pointing at it.
      if (freshlyUploaded) void deleteUnusedCover(freshlyUploaded);
      setError(cause instanceof Error ? cause.message : "Could not save.");
      setSaving(false);
    }
  }

  const paragraphCount = paragraphsOf(draft.body).length;

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
      {/* ------------------------------------------------------------------ */}
      {/* Cover — optional                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-24">
        <span className={label}>
          Cover image <span className="text-cream-dim/50 normal-case tracking-normal">(optional)</span>
        </span>
        <div className="relative aspect-16/10 w-full bg-espresso border border-gold/20 overflow-hidden flex items-center justify-center">
          {shownCover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shownCover}
              alt="Selected cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-cream-dim/60 text-xs tracking-[0.2em] uppercase px-6 text-center leading-relaxed">
              No cover
              <span className="block mt-1.5 tracking-normal normal-case text-cream-dim/40">
                A lettered panel is shown instead
              </span>
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={(event) => onPickFile(event.target.files?.[0] ?? null)}
          className="sr-only"
          id="post-cover"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <label
            htmlFor="post-cover"
            className="cursor-pointer px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            {shownCover ? "Replace" : "Upload"}
          </label>
          {shownCover && (
            <button
              type="button"
              onClick={clearCover}
              className="px-4 py-2 text-xs tracking-[0.2em] uppercase border border-gold/20 text-cream-dim hover:border-copper hover:text-copper transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <p className={hint}>
          PNG, JPEG, WebP or AVIF, up to 25 MB. Leave it empty and the post
          still looks finished — cards fall back to a lettered panel.
        </p>

        <div className="mt-6 border-t border-gold/15 pt-4">
          <span className={label}>Appears on the card as</span>
          <p className="font-display text-lg text-porcelain">
            {draft.title || "Untitled"}
          </p>
          <p className="text-copper text-xs tracking-[0.2em] uppercase mt-1">
            {formatPostDate(existing?.publishedAt ?? new Date().toISOString())} ·{" "}
            {readingMinutes(draft.body)} min read
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Fields                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-5">
        <div>
          <label className={label} htmlFor="title">Title</label>
          <input
            id="title"
            className={input}
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="On painting light"
          />
        </div>

        <div>
          <label className={label} htmlFor="excerpt">Short description</label>
          <textarea
            id="excerpt"
            rows={3}
            className={`${input} resize-y leading-relaxed`}
            value={draft.excerpt}
            onChange={(event) => set("excerpt", event.target.value)}
            placeholder="A sentence or two summarising the entry…"
          />
          <p className={hint}>
            Shown on the card and under the title. Leave it empty and the
            opening of the post is used instead.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="body">Post</label>
          <textarea
            id="body"
            rows={16}
            className={`${input} resize-y leading-loose`}
            value={draft.body}
            onChange={(event) => set("body", event.target.value)}
            placeholder={
              "Write the entry here.\n\nLeave a blank line between paragraphs — each block becomes its own paragraph on the page."
            }
          />
          <p className={hint}>
            Blank lines separate paragraphs. {paragraphCount}{" "}
            {paragraphCount === 1 ? "paragraph" : "paragraphs"} ·{" "}
            {readingMinutes(draft.body)} min read.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
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
              placeholder="on-painting-light"
            />
            <p className={hint}>The web address: /blog/{slug || "…"}</p>
          </div>
          <div>
            <label className={label} htmlFor="published">Visibility</label>
            <select
              id="published"
              className={input}
              value={draft.published ? "published" : "draft"}
              onChange={(event) => set("published", event.target.value === "published")}
            >
              <option value="published">Published — visible on /blog</option>
              <option value="draft">Draft — only you can see it</option>
            </select>
            <p className={hint}>Drafts stay hidden from visitors entirely.</p>
          </div>
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
            {saving ? "Saving…" : existing ? "Save changes" : "Publish post"}
          </button>
          <Link
            href="/admin/blog"
            className="mt-5 px-6 py-3 text-xs tracking-[0.2em] uppercase border border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
