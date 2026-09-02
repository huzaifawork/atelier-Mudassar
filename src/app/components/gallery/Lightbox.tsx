"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import type { Artwork } from "../../data/artworks";
import { categoryLabels } from "../../data/artworks";
import { DEFAULT_RATIO, displayRefFor, ratioOf } from "../../lib/galleryMap";
import ProtectedImage from "./ProtectedImage";
import StatusBadge from "./StatusBadge";
import YouTubeEmbed from "./YouTubeEmbed";

interface LightboxProps {
  artwork: Artwork;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Computes the largest box that fits `ratio` inside `slotRef`'s box, so the
 *  image frame ends exactly at the image's own edges — no letterbox bars. */
function useContainedFrame(ratio: number) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const update = () => {
      const cw = slot.clientWidth;
      const ch = slot.clientHeight;
      if (!cw || !ch) return;
      if (cw / ch > ratio) {
        setSize({ width: ch * ratio, height: ch });
      } else {
        setSize({ width: cw, height: cw / ratio });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [ratio]);

  return { slotRef, size };
}

export default function Lightbox({
  artwork,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const [ratio, setRatio] = useState(
    () => ratioOf(artwork) ?? DEFAULT_RATIO,
  );

  // Reset to the best-effort guess whenever the artwork changes (Lightbox
  // itself stays mounted across prev/next so the backdrop doesn't re-fade);
  // the real ratio then overwrites this once ProtectedImage decodes the new
  // image. Adjusting state during render (React's documented pattern for
  // this) rather than in an effect avoids an extra render + visible flash.
  const [prevSlug, setPrevSlug] = useState(artwork.slug);
  if (artwork.slug !== prevSlug) {
    setPrevSlug(artwork.slug);
    setRatio(ratioOf(artwork) ?? DEFAULT_RATIO);
  }

  const { slotRef, size } = useContainedFrame(ratio);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Minimal focus trap: Tab/Shift+Tab wrap within the dialog instead of
  // escaping into the gallery grid behind it.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={artwork.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-ink/97 backdrop-blur-lg flex items-center justify-center p-4 sm:p-10"
        onClick={onClose}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 sm:top-10 sm:right-10 z-30 w-11 h-11 rounded-full border border-gold/30 flex items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
        >
          ✕
        </button>

        <motion.div
          key={artwork.slug}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-14 max-w-5xl w-full max-h-[88vh] overflow-y-auto items-start lg:items-center"
        >
          <div
            ref={slotRef}
            className="relative w-full h-[40vh] sm:h-[50vh] lg:h-[75vh] flex items-center justify-center"
          >
            {/* Anchored to the image slot, not the viewport — the content
                column below scrolls independently on mobile, so centering
                these on the full screen (as before) let them drift onto the
                text as the user scrolled. Keeping them here means they stay
                right next to the image, wherever it ends up. */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="Previous artwork"
              className="absolute left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full border border-gold/30 bg-ink/50 backdrop-blur-sm flex items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Next artwork"
              className="absolute right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full border border-gold/30 bg-ink/50 backdrop-blur-sm flex items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
            >
              ›
            </button>

            <div
              className="relative overflow-hidden bg-espresso"
              style={
                size
                  ? { width: size.width, height: size.height }
                  : { width: "100%", height: "100%", opacity: 0 }
              }
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <ProtectedImage
                src={displayRefFor(artwork)}
                alt={artwork.title}
                magnify
                fit="contain"
                width={2048}
                quality={90}
                onNaturalSize={(w, h) => setRatio(w / h)}
              />
              {artwork.status && (
                <div className="absolute top-4 left-4 z-10">
                  <StatusBadge status={artwork.status} />
                </div>
              )}
            </div>
          </div>

          <div className="pb-4 lg:pb-0">
            <p className="text-copper text-xs tracking-[0.4em] uppercase mb-3">
              {categoryLabels[artwork.category]}
            </p>
            <h3 className="font-display text-2xl sm:text-4xl text-porcelain mb-4">
              {artwork.title}
            </h3>

            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-cream-dim/70 mb-5 pb-5 border-b border-gold/15">
              <div>
                <dt className="sr-only">Year</dt>
                <dd>{artwork.year}</dd>
              </div>
              <div>
                <dt className="sr-only">Medium</dt>
                <dd>{artwork.medium}</dd>
              </div>
              {artwork.dimensions && (
                <div>
                  <dt className="sr-only">Dimensions</dt>
                  <dd>{artwork.dimensions}</dd>
                </div>
              )}
            </dl>

            <p className="text-cream-dim/90 leading-loose text-sm sm:text-base">
              {artwork.description}
            </p>

            {artwork.details && artwork.details.length > 0 && (
              <ul className="mt-5 space-y-2">
                {artwork.details.map((detail, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-cream-dim/75 text-sm"
                  >
                    <span className="mt-2 w-1 h-1 rotate-45 bg-gold shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            )}

            {artwork.youtubeUrl && (
              <div className="mt-7">
                <YouTubeEmbed url={artwork.youtubeUrl} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
}
