"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="relative bg-ink py-32 sm:py-40 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(205,163,95,0.08),transparent_55%)]" />
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1 }}
        className="relative max-w-4xl mx-auto text-center"
      >
        <span className="inline-block text-copper text-xs tracking-[0.4em] uppercase mb-8">Introduction</span>
        <p className="font-accent italic text-2xl sm:text-3xl lg:text-4xl leading-relaxed text-porcelain/95 text-balance">
          Mudassar Ghaffar is a digital fine artist and the founder of{" "}
          <span className="text-gold-bright not-italic font-display">Atelier Mudassar</span>. His work explores
          the relationship between light, atmosphere, symbolism, and the human experience through digitally
          painted portraits, landscapes, wildlife, and conceptual compositions.
        </p>
        <p className="mt-8 text-cream-dim/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Guided by classical artistic principles and contemporary digital practice, he creates work that
          invites contemplation while celebrating craftsmanship, authenticity, and the expressive potential
          of digital fine art.
        </p>

        <div className="mt-14 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-linear-to-r from-transparent to-gold/60" />
          <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
          <span className="h-px w-16 bg-linear-to-l from-transparent to-gold/60" />
        </div>
      </motion.div>
    </section>
  );
}
