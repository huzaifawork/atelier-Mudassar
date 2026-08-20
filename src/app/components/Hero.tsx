"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="top" className="relative w-full bg-ink overflow-hidden pt-24 sm:pt-0 sm:h-svh">
      {/* Visually hidden: the page has no visible headline (it's image-led by
          design), but screen readers and search engines still need one
          top-level heading to anchor the document outline. */}
      <h1 className="sr-only">Mudassar Ghaffar — Atelier Mudassar, Digital Fine Artist</h1>

      {/* Mobile — dedicated portrait crop, shown below sm */}
      <div className="relative w-full sm:hidden" style={{ aspectRatio: "768/1376" }}>
        <Image
          src="/hero/hero-mobile.jpg"
          alt="Digital fine art by Mudassar Ghaffar"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Desktop / tablet — full-bleed landscape artwork */}
      <div className="hidden sm:block absolute inset-0">
        <Image
          src="/hero/heroimage.jpeg"
          alt="Digital fine art by Mudassar Ghaffar"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Buttons — floating over the image, no backing panel; centered on mobile, left-aligned on larger screens */}
      <div className="absolute inset-x-0 bottom-6 sm:bottom-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-6xl mx-auto sm:px-10 flex justify-center sm:justify-start gap-2.5 sm:gap-4"
        >
          <a
            href="#gallery"
            className="group relative overflow-hidden border border-gold/60 text-[0.65rem] sm:text-sm tracking-[0.08em] sm:tracking-[0.18em] uppercase text-porcelain text-center whitespace-nowrap px-4 sm:px-8 py-2.5 sm:py-3.5"
          >
            <span className="absolute inset-0 bg-gold translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" />
            <span className="relative transition-colors duration-300 group-hover:text-ink">View Portfolio</span>
          </a>
          <a
            href="#contact"
            className="border border-porcelain/60 hover:border-gold/50 text-[0.65rem] sm:text-sm tracking-[0.08em] sm:tracking-[0.18em] uppercase text-porcelain hover:text-gold-bright transition-all duration-300 text-center whitespace-nowrap px-4 sm:px-8 py-2.5 sm:py-3.5"
          >
            Get in Touch
          </a>
        </motion.div>
      </div>
    </section>
  );
}
