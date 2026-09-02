"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { categoryLabels, type Artwork, type Category } from "../data/artworks";
import { useGallery } from "../lib/galleryStore";
import { DEFAULT_RATIO, displayRefFor, ratioOf } from "../lib/galleryMap";
import ProtectedImage from "./gallery/ProtectedImage";
import StatusBadge from "./gallery/StatusBadge";
import Lightbox from "./gallery/Lightbox";

type Filter = "all" | Category;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All Work" },
  { key: "portrait", label: categoryLabels.portrait },
  { key: "wildlife", label: categoryLabels.wildlife },
  { key: "landscape", label: categoryLabels.landscape },
];

function VideoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5 translate-x-px"
    >
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

/**
 * One artwork in the grid, sized to the piece itself.
 *
 * The card used to be a fixed 3:4 box, which meant a landscape or square work
 * was drawn small in the middle of a portrait frame with bars either side —
 * every piece read as a portrait regardless of what was uploaded. The box now
 * takes the artwork's own aspect ratio instead, so the frame ends exactly at
 * the image's edges.
 *
 * Artwork uploaded since the real pixel size started being recorded knows its
 * shape up front, so the card reserves the right space before the image
 * arrives and nothing shifts. Older pieces fall back to their `dimensions`
 * text, and failing that correct themselves once the image reports its true
 * size on load.
 */
function GalleryCard({
  artwork,
  index,
  onOpen,
}: {
  artwork: Artwork;
  index: number;
  onOpen: () => void;
}) {
  const [ratio, setRatio] = useState(() => ratioOf(artwork) ?? DEFAULT_RATIO);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      // Capped: the stagger is a flourish for the handful of cards entering
      // at once, and an uncapped index * 0.04 would leave the 300th artwork
      // invisible for twelve seconds.
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04 }}
      onClick={onOpen}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ aspectRatio: ratio }}
      className="group relative block w-full overflow-hidden bg-espresso cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
    >
      {/* The box is already the image's shape, so "contain" crops nothing —
          it just guarantees the whole piece stays visible if a recorded size
          is ever slightly out of step with the file. */}
      <ProtectedImage
        src={displayRefFor(artwork)}
        alt={artwork.title}
        fit="contain"
        width={750}
        // 90 rather than 75: the derivative is itself a WebP encode, so this
        // is a second generation, and the seam shows in smooth gradients. The
        // difference is 23 KB against 53 KB per card — worth it on a site
        // whose whole purpose is the artwork.
        quality={90}
        onNaturalSize={(w, h) => setRatio(w / h)}
      />

      {/* Legibility scrim for the title, confined to the bottom of the card
          and only while hovered. This used to be a dark gradient across the
          whole card at 70% opacity, which veiled every piece in the grid and
          left the work looking flatter and less saturated than it is. Small
          screens don't need it at all: the caption block below carries its
          own gradient there, because it is always shown. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink via-ink/30 to-transparent opacity-0 sm:group-hover:opacity-95 transition-opacity duration-500" />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
        {artwork.status && <StatusBadge status={artwork.status} />}
        {artwork.youtubeUrl && (
          <span
            aria-hidden
            className="ml-auto w-8 h-8 shrink-0 rounded-full border border-gold-bright/60 bg-ink/60 backdrop-blur-sm flex items-center justify-center text-gold-bright"
          >
            <VideoGlyph />
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 translate-y-0 sm:translate-y-2 opacity-100 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 bg-linear-to-t from-ink/90 to-transparent sm:bg-none">
        <p className="font-display text-lg sm:text-xl text-porcelain">
          {artwork.title}
        </p>
        <p className="text-copper text-xs tracking-[0.2em] uppercase mt-1">
          {artwork.year} · {categoryLabels[artwork.category]}
        </p>
      </div>

      <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gold-bright/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-gold-bright"
        >
          <path
            d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </motion.button>
  );
}

/** Cards rendered per batch. More are appended as the visitor nears the end. */
const BATCH = 12;

export default function Gallery() {
  const { items, settings } = useGallery();
  const [filter, setFilter] = useState<Filter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.category === filter)),
    [filter, items],
  );

  // Only a batch is mounted at a time. Each card carries an IntersectionObserver,
  // a canvas and a motion component, so a collection of several hundred would
  // otherwise cost that much work up front — before a single pixel of artwork
  // has been fetched. The lightbox still walks the full filtered list, so
  // paging the DOM doesn't shorten what prev/next can reach.
  const rendered = useMemo(() => visible.slice(0, shown), [visible, shown]);
  const hasMore = shown < visible.length;

  // Start again at one batch whenever the filter changes the list underneath.
  // Adjusted during render (React's documented pattern for deriving state from
  // a prop change, and what Lightbox does for the same reason) rather than in
  // an effect, which would render one frame of the old count first.
  const [batchedFilter, setBatchedFilter] = useState(filter);
  if (filter !== batchedFilter) {
    setBatchedFilter(filter);
    setShown(BATCH);
  }

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShown((count) => count + BATCH);
      },
      // Well ahead of the viewport, so the next batch is mounted and its
      // images are already fetching by the time they are scrolled to.
      { rootMargin: "1200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const active = activeIndex !== null ? visible[activeIndex] : null;

  const close = () => setActiveIndex(null);
  const prev = () =>
    setActiveIndex((i) =>
      i === null ? null : (i - 1 + visible.length) % visible.length,
    );
  const next = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % visible.length));

  useEffect(() => {
    if (activeIndex === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex]);

  // Best-effort deterrent against the browser's "Save Page As" shortcut while
  // the gallery is on screen. Not a security boundary — a determined user can
  // still reach the image bytes via devtools — just one more layer alongside
  // canvas rendering (no plain <img> src to drag/save) and the disabled
  // right-click/drag handlers on each ProtectedImage.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <section id="gallery" className="relative bg-ink py-28 sm:py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14"
          >
            <span className="text-copper text-xs tracking-[0.4em] uppercase">
              {settings.eyebrow}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-porcelain mt-4">
              {settings.heading}
            </h2>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright ${
                  filter === f.key
                    ? "border-gold bg-gold text-ink"
                    : "border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* A plain grid, deliberately. Cards are each the artwork's own
              shape now, so a multi-column masonry closes the gaps under the
              shorter ones more neatly — but CSS columns fragment a child
              across a column boundary when break-inside-avoid can't be
              honoured, and a fragmented card ends up a sliver whose
              IntersectionObserver never fires, so its artwork simply never
              loads. Ragged row heights are a far better failure than a piece
              that doesn't appear. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
            <AnimatePresence>
              {rendered.map((art, i) => (
                <GalleryCard
                  key={art.slug}
                  artwork={art}
                  index={i}
                  onOpen={() => setActiveIndex(i)}
                />
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div
              ref={sentinelRef}
              aria-hidden
              className="h-px w-full"
            />
          )}
        </div>

        <AnimatePresence>
          {active && (
            <Lightbox
              artwork={active}
              onClose={close}
              onPrev={prev}
              onNext={next}
            />
          )}
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
