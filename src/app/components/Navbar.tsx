"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const links = [
  { label: "About", href: "#about" },
  { label: "Statement", href: "#statement" },
  { label: "Gallery", href: "#gallery" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled ? "bg-ink/85 backdrop-blur-md border-b border-gold/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link href="#top" className="flex items-center gap-3 group">
            <Image
              src="/art/logo.png"
              alt="Atelier Mudassar crest"
              width={44}
              height={44}
              className="rounded-full transition-transform duration-500 group-hover:rotate-[20deg]"
            />
            <span className="font-display text-lg tracking-[0.15em] text-porcelain uppercase hidden sm:block">
              Atelier <span className="text-gold">Mudassar</span>
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="relative text-[0.8rem] tracking-[0.2em] uppercase text-cream-dim hover:text-gold-bright transition-colors duration-300 py-2 group"
                >
                  {l.label}
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-gold-bright transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden relative w-8 h-6 flex flex-col justify-between text-porcelain"
          >
            <span
              className={`block h-px w-full bg-current transition-transform duration-300 ${open ? "translate-y-[11px] rotate-45" : ""}`}
            />
            <span className={`block h-px w-full bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-px w-full bg-current transition-transform duration-300 ${open ? "-translate-y-[11px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {links.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.5 }}
                className="font-display text-3xl text-porcelain hover:text-gold transition-colors"
              >
                {l.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
