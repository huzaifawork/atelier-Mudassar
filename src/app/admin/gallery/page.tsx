"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  categoryLabels,
  statusLabels,
  statusOrder,
  type Artwork,
  type ArtworkStatus,
} from "../../data/artworks";
import { useGallery } from "../../lib/galleryStore";
import { imageSrcFor } from "../../lib/galleryMap";
import StatusBadge from "../../components/gallery/StatusBadge";
import PreviewModal from "./PreviewModal";
import SettingsPanel from "./SettingsPanel";
import ConfirmDialog from "../ConfirmDialog";

const action =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

function VideoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 translate-x-px">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

export default function AdminGalleryPage() {
  const {
    items,
    loaded,
    error,
    setStatus,
    deleteItem,
    reorderItem,
    seedDemoItems,
  } = useGallery();
  const [previewing, setPreviewing] = useState<Artwork | null>(null);
  const [confirming, setConfirming] = useState<Artwork | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(id: string, work: () => Promise<unknown>) {
    setBusy(id);
    setNotice(null);
    try {
      await work();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-porcelain">Gallery</h1>
          <p className="text-sm text-cream-dim/60 mt-1">
            {loaded
              ? `${items.length} ${items.length === 1 ? "artwork" : "artworks"} shown on the site`
              : "Loading…"}
          </p>
        </div>
        <Link
          href="/admin/gallery/new"
          className="px-5 py-3 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors"
        >
          + Add artwork
        </Link>
      </div>

      <SettingsPanel />

      {(error || notice) && (
        <p className="mb-6 border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
          {error ?? notice}
        </p>
      )}

      {loaded && items.length === 0 && (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">The gallery is empty</p>
          <p className="text-sm text-cream-dim/60 mt-2 max-w-md mx-auto">
            Add your first artwork, or load a few demo pieces to see how a
            finished entry looks. Demo pieces can be deleted at any time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href="/admin/gallery/new"
              className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors"
            >
              Add artwork
            </Link>
            <button
              onClick={() => run("seed", seedDemoItems)}
              disabled={busy === "seed"}
              className={`${action} border-gold/40 text-gold-bright hover:bg-gold hover:text-ink disabled:opacity-50 px-5 py-2.5 text-xs`}
            >
              {busy === "seed" ? "Adding…" : "Load demo artworks"}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="grid grid-cols-[76px_1fr] sm:grid-cols-[76px_1fr_auto] gap-4 items-start border border-gold/15 bg-espresso/40 p-3 hover:border-gold/30 transition-colors"
          >
            <div className="relative aspect-3/4 w-full bg-espresso overflow-hidden">
              {/* A small, optimized thumbnail — not the full-resolution
                  original — keeps this list fast even with many large
                  admin-uploaded images. */}
              <Image
                src={imageSrcFor(item.image)}
                alt=""
                width={96}
                height={128}
                className="w-full h-full object-cover"
                onContextMenu={(event) => event.preventDefault()}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg text-porcelain truncate">
                  {item.title}
                </p>
                {item.status && <StatusBadge status={item.status} />}
                {item.youtubeUrl && (
                  <span
                    title="Has a related video"
                    className="w-6 h-6 shrink-0 rounded-full border border-gold-bright/50 flex items-center justify-center text-gold-bright"
                  >
                    <VideoGlyph />
                  </span>
                )}
              </div>

              <p className="text-copper text-[0.68rem] tracking-[0.2em] uppercase mt-1">
                {item.year} · {categoryLabels[item.category]}
              </p>

              <p className="text-xs text-cream-dim/70 mt-1.5">
                {item.medium}
                {item.dimensions ? ` · ${item.dimensions}` : ""}
                {item.details?.length ? ` · ${item.details.length} detail lines` : ""}
              </p>

              {item.description && (
                <p className="text-sm text-cream-dim/70 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-2 sm:justify-end sm:max-w-[15rem]">
              <Link
                href={`/admin/gallery/${item.id}/edit`}
                className={`${action} border-gold/40 text-gold-bright hover:bg-gold hover:text-ink`}
              >
                Edit
              </Link>
              <button
                onClick={() => setPreviewing(item)}
                className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright`}
              >
                Preview
              </button>

              <select
                aria-label={`Status for ${item.title}`}
                value={item.status ?? ""}
                disabled={busy === item.id}
                onChange={(event) =>
                  run(item.id, () =>
                    setStatus(
                      item.id,
                      event.target.value === ""
                        ? undefined
                        : (event.target.value as ArtworkStatus),
                    ),
                  )
                }
                className="px-2 py-1.5 text-[0.62rem] tracking-[0.12em] uppercase bg-espresso border border-gold/20 text-cream-dim hover:border-gold/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
              >
                <option value="">No status</option>
                {statusOrder.map((key) => (
                  <option key={key} value={key}>
                    {statusLabels[key]}
                  </option>
                ))}
              </select>

              <div className="flex gap-1">
                <button
                  onClick={() => run(item.id, () => reorderItem(item.id, -1))}
                  disabled={index === 0 || busy === item.id}
                  aria-label={`Move ${item.title} earlier`}
                  className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-25 disabled:cursor-not-allowed`}
                >
                  ↑
                </button>
                <button
                  onClick={() => run(item.id, () => reorderItem(item.id, 1))}
                  disabled={index === items.length - 1 || busy === item.id}
                  aria-label={`Move ${item.title} later`}
                  className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-25 disabled:cursor-not-allowed`}
                >
                  ↓
                </button>
              </div>

              <button
                onClick={() => setConfirming(item)}
                className={`${action} border-copper/40 text-copper hover:bg-copper hover:text-ink`}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {previewing && (
        <PreviewModal artwork={previewing} onClose={() => setPreviewing(null)} />
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete "${confirming.title}"?`}
          description="This removes it from the public gallery and deletes the uploaded image. It can't be undone."
          confirmLabel="Delete artwork"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const target = confirming;
            setConfirming(null);
            void run(target.id, () => deleteItem(target.id));
          }}
        />
      )}
    </>
  );
}
