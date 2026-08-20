"use client";

import { use } from "react";
import Link from "next/link";
import ArtworkForm from "../../ArtworkForm";
import { useGallery } from "../../../../lib/galleryStore";

export default function EditArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getItem, loaded } = useGallery();
  const artwork = getItem(id);

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/gallery"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Gallery
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">
          {artwork ? `Edit “${artwork.title}”` : "Edit artwork"}
        </h1>
      </div>

      {!loaded ? (
        <p className="text-sm text-cream-dim/60">Loading…</p>
      ) : artwork ? (
        <ArtworkForm key={artwork.id} existing={artwork} />
      ) : (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">Artwork not found</p>
          <p className="text-sm text-cream-dim/60 mt-2">
            It may have been deleted.
          </p>
          <Link
            href="/admin/gallery"
            className="inline-block mt-6 px-5 py-2.5 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            Back to gallery
          </Link>
        </div>
      )}
    </>
  );
}
