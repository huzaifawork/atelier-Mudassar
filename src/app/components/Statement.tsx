"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Statement() {
  return (
    <section id="statement" className="relative bg-espresso py-28 sm:py-36 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_80%,rgba(195,128,90,0.12),transparent_55%)]" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 lg:order-1"
        >
          <span className="text-copper text-xs tracking-[0.4em] uppercase">Artist Statement</span>
          <h2 className="font-display text-3xl sm:text-4xl text-porcelain mt-4 mb-8">In His Own Words</h2>
          <p className="text-cream-dim/90 leading-loose text-[1.05rem]">
            My work explores emotion, identity, spirituality, and the human experience through digital fine
            art. Drawing inspiration from people, cultures, philosophy, and the natural world, I create images
            that invite contemplation and emotional connection.
          </p>
          <p className="text-cream-dim/90 leading-loose text-[1.05rem] mt-5">
            By combining classical artistic principles with contemporary digital techniques, I strive to
            create timeless works that balance realism, symbolism, and visual storytelling. Through Atelier
            Mudassar, I am committed to building a body of work defined by artistic excellence, authenticity,
            and the evolving possibilities of digital fine art.
          </p>
          <p className="mt-8 font-accent italic text-gold-bright text-lg">— Mudassar Ghaffar</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:order-2 relative aspect-[4/5] max-w-sm mx-auto w-full"
        >
          <div className="absolute -inset-3 border border-gold/25 rounded-sm" />
          <Image
            src="/art/artist_photo.png"
            alt="Portrait of Mudassar Ghaffar, founder of Atelier Mudassar"
            fill
            sizes="(max-width: 1024px) 60vw, 30vw"
            className="object-cover rounded-sm"
          />
        </motion.div>
      </div>
    </section>
  );
}
