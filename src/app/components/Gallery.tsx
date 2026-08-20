"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { categoryLabels, type Category } from "../data/artworks";
import { useGallery } from "../lib/galleryStore";
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

export default function Gallery() {
  const { items, settings } = useGallery();
  const [filter, setFilter] = useState<Filter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.category === filter)),
    [filter, items],
  );

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

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((art, i) => (
                <motion.button
                  key={art.slug}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  onClick={() => setActiveIndex(i)}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  className="group relative overflow-hidden bg-espresso cursor-pointer text-left aspect-3/4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
                >
                  <ProtectedImage
                    src={art.image}
                    alt={art.title}
                    fit="contain"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
                    {art.status && <StatusBadge status={art.status} />}
                    {art.youtubeUrl && (
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
                      {art.title}
                    </p>
                    <p className="text-copper text-xs tracking-[0.2em] uppercase mt-1">
                      {art.year} · {categoryLabels[art.category]}
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
              ))}
            </AnimatePresence>
          </motion.div>
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
