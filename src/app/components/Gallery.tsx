"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { artworks, categoryLabels, type Category } from "../data/artworks";

type Filter = "all" | Category;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All Work" },
  { key: "portrait", label: categoryLabels.portrait },
  { key: "wildlife", label: categoryLabels.wildlife },
  { key: "landscape", label: categoryLabels.landscape },
];

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? artworks : artworks.filter((a) => a.category === filter)),
    [filter]
  );

  const active = activeIndex !== null ? visible[activeIndex] : null;

  const close = () => setActiveIndex(null);
  const prev = () => setActiveIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));
  const next = () => setActiveIndex((i) => (i === null ? null : (i + 1) % visible.length));

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

  return (
    <section id="gallery" className="relative bg-ink py-28 sm:py-36 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <span className="text-copper text-xs tracking-[0.4em] uppercase">Selected Works</span>
          <h2 className="font-display text-4xl sm:text-5xl text-porcelain mt-4">The Gallery</h2>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-xs tracking-[0.2em] uppercase border transition-all duration-300 cursor-pointer ${
                filter === f.key
                  ? "border-gold bg-gold text-ink"
                  : "border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                className={`group relative overflow-hidden rounded-sm bg-espresso cursor-pointer text-left ${
                  i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                  <p className="font-display text-lg sm:text-xl text-porcelain">{art.title}</p>
                  <p className="text-copper text-xs tracking-[0.2em] uppercase mt-1">
                    {art.year} · {categoryLabels[art.category]}
                  </p>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gold-bright/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gold-bright">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/97 backdrop-blur-lg flex items-center justify-center p-4 sm:p-10"
            onClick={close}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-6 right-6 sm:top-10 sm:right-10 w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer"
            >
              ✕
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
              className="hidden sm:flex absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold/30 items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
              className="hidden sm:flex absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold/30 items-center justify-center text-porcelain hover:border-gold hover:text-gold-bright transition-colors cursor-pointer"
            >
              ›
            </button>

            <motion.div
              key={active.slug}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-14 max-w-5xl w-full max-h-[88vh] items-center"
            >
              <div className="relative w-full h-[45vh] lg:h-[75vh] rounded-sm overflow-hidden">
                <Image src={active.image} alt={active.title} fill sizes="70vw" className="object-cover" />
              </div>
              <div>
                <p className="text-copper text-xs tracking-[0.4em] uppercase mb-4">
                  {categoryLabels[active.category]}
                </p>
                <h3 className="font-display text-3xl sm:text-4xl text-porcelain mb-3">{active.title}</h3>
                <p className="text-cream-dim/70 text-sm mb-6">
                  {active.year} · {active.medium}
                </p>
                <p className="text-cream-dim/90 leading-loose">{active.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
