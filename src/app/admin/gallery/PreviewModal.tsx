"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type { Artwork } from "../../data/artworks";
import Lightbox from "../../components/gallery/Lightbox";

/**
 * Renders the real public Lightbox rather than an admin-only mock, so what the
 * admin checks here is literally what a visitor gets — same magnifier, same
 * status capsule, same field-hiding rules, same video embed.
 */
export default function PreviewModal({
  artwork,
  onClose,
}: {
  artwork: Artwork;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
        <span className="px-4 py-2 text-[0.62rem] tracking-[0.25em] uppercase border border-gold/40 bg-ink/85 backdrop-blur-sm text-gold-bright">
          Visitor preview — Esc to close
        </span>
      </div>
      <AnimatePresence>
        {/* Single-item preview, so the arrows have nowhere to go. */}
        <Lightbox
          artwork={artwork}
          onClose={onClose}
          onPrev={() => {}}
          onNext={() => {}}
        />
      </AnimatePresence>
    </>
  );
}
