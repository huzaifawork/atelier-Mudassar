"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden bg-ink flex items-center">
      {/* atmospheric gradient wash across whole hero (base layer) */}
      <div className="absolute inset-0 bg-linear-to-br from-espresso via-ink to-ink" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(205,163,95,0.10),transparent_60%)]" />

      {/* Portrait image, right side, full bleed */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[62%] lg:w-[54%]">
        <Image
          src="/art/hero_portrait.png"
          alt="Featured digital fine art portrait by Mudassar Ghaffar"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 60vw"
          className="object-cover object-[30%_center] opacity-70 sm:opacity-100"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/40 to-transparent sm:from-ink sm:via-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-8"
          >
            <Image src="/art/logo.png" alt="Atelier Mudassar crest" width={64} height={64} className="rounded-full" />
            <span className="h-px flex-1 max-w-[80px] bg-linear-to-r from-gold/70 to-transparent" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-porcelain text-balance"
          >
            Atelier <span className="italic text-gold-bright">Mudassar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="mt-5 text-copper text-xs sm:text-sm tracking-[0.4em] uppercase"
          >
            Digital Fine Artist
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-8 text-cream-dim/90 text-base sm:text-lg leading-relaxed max-w-md"
          >
            Digitally painted portraits, landscapes, and wildlife exploring the
            relationship between light, atmosphere, and the human experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <a
              href="#gallery"
              className="group relative px-8 py-3.5 overflow-hidden rounded-full border border-gold/50 text-sm tracking-[0.15em] uppercase text-porcelain"
            >
              <span className="absolute inset-0 bg-gold translate-y-full transition-transform duration-400 ease-out group-hover:translate-y-0" />
              <span className="relative transition-colors duration-400 group-hover:text-ink">View Portfolio</span>
            </a>
            <a
              href="#contact"
              className="text-sm tracking-[0.15em] uppercase text-cream-dim hover:text-gold-bright transition-colors border-b border-transparent hover:border-gold-bright pb-1"
            >
              Get in Touch
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-[0.65rem] tracking-[0.3em] uppercase text-cream-dim/60">Scroll</span>
        <span className="w-px h-10 bg-linear-to-b from-gold/70 to-transparent relative overflow-hidden">
          <motion.span
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gold-bright"
          />
        </span>
      </motion.div>
    </section>
  );
}
