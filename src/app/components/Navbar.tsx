"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const links = [
  { label: "About", href: "#about" },
  { label: "Statement", href: "#statement" },
  { label: "Gallery", href: "#gallery" },
  { label: "Process", href: "#process" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Active section tracking
  useEffect(() => {
    const sections = ["about", "statement", "gallery", "process", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setOpen(false);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled ? "bg-ink/90 backdrop-blur-md border-b border-gold/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-24 flex items-center justify-between">

          {/* Logo + Brand */}
          <button onClick={scrollToTop} className="flex items-center gap-3 group cursor-pointer">
            <Image
              src="/logo/logo.png"
              alt="Atelier Mudassar crest"
              width={80}
              height={80}
              priority
              className="transition-transform duration-500 group-hover:rotate-[20deg] drop-shadow-[0_0_8px_rgba(205,163,95,0.25)]"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm sm:text-base tracking-[0.15em] text-porcelain uppercase">
                Atelier <span className="text-gold">Mudassar</span>
              </span>
              <span className="text-[0.6rem] tracking-[0.3em] text-cream-dim/70 uppercase hidden sm:block">
                Digital Fine Artist
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className={`relative text-[0.78rem] tracking-[0.2em] uppercase transition-colors duration-300 py-2 group ${
                    active === l.href.slice(1) ? "text-gold-bright" : "text-cream-dim hover:text-gold-bright"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute left-0 -bottom-0.5 h-px bg-gold-bright transition-all duration-300 ${
                      active === l.href.slice(1) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className={`text-[0.72rem] tracking-[0.25em] uppercase font-medium border px-5 py-3 transition-all duration-300 ${
                  active === "contact"
                    ? "border-gold bg-gold text-ink"
                    : "border-gold/50 text-gold hover:bg-gold hover:text-ink"
                }`}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Hamburger — 44×44 touch target */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px] text-porcelain"
          >
            <span className={`block h-px w-6 bg-current transition-all duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-px w-6 bg-current transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-px w-6 bg-current transition-all duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-ink/98 backdrop-blur-xl flex flex-col items-center justify-center md:hidden"
          >
            {/* Explicit close button */}
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-7 right-6 w-11 h-11 flex items-center justify-center border border-gold/30 text-porcelain hover:border-gold hover:text-gold transition-colors text-xl"
            >
              ✕
            </button>

            <button onClick={scrollToTop} className="mb-8">
              <Image src="/logo/logo.png" alt="Atelier Mudassar" width={72} height={72} />
            </button>

            <nav className="flex flex-col items-center gap-1 w-full px-10">
              {links.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className={`w-full text-center font-display text-3xl py-4 border-b border-gold/10 transition-colors ${
                    active === l.href.slice(1) ? "text-gold" : "text-porcelain hover:text-gold"
                  }`}
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * links.length, duration: 0.35 }}
                className="mt-8 text-[0.75rem] tracking-[0.25em] uppercase font-medium border border-gold/50 text-gold px-10 py-4 hover:bg-gold hover:text-ink transition-all duration-300"
              >
                Contact
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
