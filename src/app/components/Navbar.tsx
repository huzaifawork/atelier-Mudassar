"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

/** Sections live on the landing page; the journal is a page of its own. */
const sections = [
  { label: "About", id: "about" },
  { label: "Statement", id: "statement" },
  { label: "Gallery", id: "gallery" },
  { label: "Process", id: "process" },
];

const JOURNAL_HREF = "/blog";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const router = useRouter();

  // The nav is shared by the landing page and the journal, so section links
  // have to be absolute once we're off "/" — a bare "#about" would just add a
  // fragment to /blog and go nowhere.
  const onHome = pathname === "/";
  const hrefFor = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const onJournal = pathname === JOURNAL_HREF || pathname.startsWith(`${JOURNAL_HREF}/`);
  // Off the landing page there are no sections to highlight.
  const activeSection = onHome ? active : "";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Active section tracking — only meaningful on the landing page, so off it
  // the observer never runs and `active` is ignored rather than reset.
  useEffect(() => {
    if (!onHome) return;
    const ids = [...sections.map((s) => s.id), "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Close the mobile menu whenever navigation actually lands somewhere new.
  // Adjusting during render rather than in an effect keeps React from doing a
  // second pass with the overlay still open on the new page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const goHome = useCallback(() => {
    setOpen(false);
    if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
    else router.push("/");
  }, [onHome, router]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled || !onHome
            ? "bg-ink/90 backdrop-blur-md border-b border-gold/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-24 flex items-center justify-between">

          {/* Logo + Brand */}
          <button onClick={goHome} className="flex items-center gap-3 group cursor-pointer">
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
            {sections.map((l) => (
              <li key={l.label}>
                <a
                  href={hrefFor(l.id)}
                  className={`relative text-[0.78rem] tracking-[0.2em] uppercase transition-colors duration-300 py-2 group ${
                    activeSection === l.id ? "text-gold-bright" : "text-cream-dim hover:text-gold-bright"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute left-0 -bottom-0.5 h-px bg-gold-bright transition-all duration-300 ${
                      activeSection === l.id ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </a>
              </li>
            ))}
            <li>
              <Link
                href={JOURNAL_HREF}
                className={`relative text-[0.78rem] tracking-[0.2em] uppercase transition-colors duration-300 py-2 group ${
                  onJournal ? "text-gold-bright" : "text-cream-dim hover:text-gold-bright"
                }`}
              >
                Journal
                <span
                  className={`absolute left-0 -bottom-0.5 h-px bg-gold-bright transition-all duration-300 ${
                    onJournal ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            </li>
            <li>
              <a
                href={hrefFor("contact")}
                className={`text-[0.72rem] tracking-[0.25em] uppercase font-medium border px-5 py-3 transition-all duration-300 ${
                  activeSection === "contact"
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

            <button onClick={goHome} className="mb-8">
              <Image src="/logo/logo.png" alt="Atelier Mudassar" width={72} height={72} />
            </button>

            <nav className="flex flex-col items-center gap-1 w-full px-10 max-h-[70vh] overflow-y-auto">
              {sections.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={hrefFor(l.id)}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className={`w-full text-center font-display text-3xl py-4 border-b border-gold/10 transition-colors ${
                    activeSection === l.id ? "text-gold" : "text-porcelain hover:text-gold"
                  }`}
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * sections.length, duration: 0.35 }}
                className="w-full"
              >
                <Link
                  href={JOURNAL_HREF}
                  onClick={() => setOpen(false)}
                  className={`block w-full text-center font-display text-3xl py-4 border-b border-gold/10 transition-colors ${
                    onJournal ? "text-gold" : "text-porcelain hover:text-gold"
                  }`}
                >
                  Journal
                </Link>
              </motion.div>
              <motion.a
                href={hrefFor("contact")}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (sections.length + 1), duration: 0.35 }}
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
