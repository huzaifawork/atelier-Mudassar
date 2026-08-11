"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const socials = [
  { label: "Email", value: "mudassarg@gmail.com", href: "mailto:mudassarg@gmail.com" },
  { label: "Instagram", value: "@ateliermudassar", href: "https://instagram.com/ateliermudassar" },
  { label: "LinkedIn", value: "mudassar-ghaffar", href: "https://linkedin.com/in/mudassar-ghaffar" },
  { label: "YouTube", value: "@Mudassar81", href: "https://youtube.com/@Mudassar81" },
  { label: "Behance", value: "mudassarghaffar", href: "https://behance.net/mudassarghaffar" },
];

export default function Contact() {
  return (
    <section id="contact" className="relative bg-espresso pt-28 sm:pt-36 pb-14 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(205,163,95,0.10),transparent_55%)]" />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-copper text-xs tracking-[0.4em] uppercase">Let&rsquo;s Connect</span>
            <h2 className="font-display text-4xl sm:text-5xl text-porcelain mt-4 mb-3">Mudassar Ghaffar</h2>
            <p className="font-accent italic text-gold-bright text-lg mb-8">Founder · Atelier Mudassar</p>
            <p className="text-cream-dim/85 leading-relaxed max-w-md mb-10">
              Through Atelier Mudassar, I create digital fine art that explores the quiet relationship
              between light, form, and human presence. My work invites viewers to pause, reflect, and
              discover beauty in moments of stillness.
            </p>

            <a
              href="mailto:mudassarg@gmail.com"
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gold text-ink text-sm tracking-[0.15em] uppercase transition-transform duration-300 hover:scale-[1.03]"
            >
              Start a Commission
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col divide-y divide-gold/10 border-y border-gold/10"
          >
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.label !== "Email" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-center justify-between py-4 text-sm"
              >
                <span className="text-cream-dim/60 tracking-[0.2em] uppercase text-xs">{s.label}</span>
                <span className="text-porcelain group-hover:text-gold-bright transition-colors">{s.value}</span>
              </a>
            ))}
          </motion.div>
        </div>

        <div className="mt-24 pt-8 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Image src="/art/logo.png" alt="Atelier Mudassar crest" width={40} height={40} className="rounded-full opacity-80" />
          <p className="text-cream-dim/40 text-xs tracking-[0.15em] uppercase text-center">
            © {new Date().getFullYear()} Atelier Mudassar. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
