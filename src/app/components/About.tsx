"use client";

import { motion } from "framer-motion";
import YouTubeEmbed from "./gallery/YouTubeEmbed";

const ABOUT_VIDEO_URL = "https://youtu.be/0P3V_5fMX8Q?si=PEw0oDXGVm2vSLzS";

export default function About() {
  return (
    <section id="about" className="relative bg-ink py-20 sm:py-40 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(205,163,95,0.08),transparent_55%)]" />
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block text-copper text-xs tracking-[0.4em] uppercase mb-6">Introduction</span>
          <h2 className="font-display text-3xl sm:text-4xl text-porcelain mb-6 sm:mb-8">Meet the Artist</h2>
          <p className="font-accent italic text-lg sm:text-xl leading-relaxed text-porcelain/95 text-balance">
            Mudassar Ghaffar is a digital fine artist and the founder of{" "}
            <span className="text-gold-bright not-italic font-display">Atelier Mudassar</span>. His work explores
            the relationship between light, atmosphere, symbolism, and the human experience through digitally
            painted portraits, landscapes, wildlife, and conceptual compositions.
          </p>
          <p className="mt-6 text-cream-dim/80 text-sm sm:text-base leading-relaxed">
            Guided by classical artistic principles and contemporary digital practice, he creates work that
            invites contemplation while celebrating craftsmanship, authenticity, and the expressive potential
            of digital fine art.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
            <span className="h-px w-16 bg-linear-to-r from-gold/60 to-transparent" />
          </div>
        </motion.div>

        {/* Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg mx-auto lg:max-w-none"
        >
          <div className="absolute -inset-3 border border-gold/25 rounded-sm pointer-events-none" />

          <YouTubeEmbed url={ABOUT_VIDEO_URL} label="Inside the Atelier" />
        </motion.div>
      </div>
    </section>
  );
}
