"use client";

import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import CoverArt from "./journal/CoverArt";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * A card on the landing page, already flattened from a post or an event.
 *
 * The section shows both kinds side by side, so the page component resolves
 * each record down to the same shape on the server rather than shipping two
 * record types and the logic to tell them apart.
 */
export interface TeaserItem {
  kind: "post" | "event";
  key: string;
  href: string;
  title: string;
  excerpt: string;
  cover?: string;
  dateLabel: string;
  aside?: string;
}

/**
 * Journal and Events on the landing page.
 *
 * Deliberately a taste rather than a list: the three most recent things,
 * each opening its own page, with one way through to everything else. The
 * landing page is about the work, so this sits below it and stays short.
 */
export default function JournalTeaser({ items }: { items: TeaserItem[] }) {
  if (items.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="journal"
        className="relative bg-espresso py-24 sm:py-32 px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(205,163,95,0.10),transparent_55%)]" />
        <div className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease }}
            className="flex flex-wrap items-end justify-between gap-6 mb-12 sm:mb-14"
          >
            <div>
              <span className="text-copper text-xs tracking-[0.4em] uppercase">
                From the Atelier
              </span>
              <h2 className="font-display text-4xl sm:text-5xl text-porcelain mt-4">
                Journal &amp; Events
              </h2>
              <p className="text-cream-dim/80 mt-4 max-w-md leading-relaxed">
                Writing from the studio, and where the work has been shown and
                written about.
              </p>
            </div>

            <Link
              href="/journal"
              className="group inline-flex items-center gap-3 text-xs tracking-[0.25em] uppercase text-gold-bright border-b border-gold/40 pb-2 hover:border-gold-bright transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
            >
              See everything
              <span className="h-px w-8 bg-gold-bright/60 transition-all duration-500 group-hover:w-14" />
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
            {items.map((item, index) => (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease, delay: index * 0.08 }}
                className="group"
              >
                <Link
                  href={item.href}
                  className="flex h-full flex-col border border-gold/15 bg-ink/40 transition-colors duration-500 hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
                >
                  <div className="relative aspect-16/10 w-full overflow-hidden">
                    <CoverArt
                      src={item.cover}
                      title={item.title}
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                      className="transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    />
                    <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
                    <span
                      className={`absolute top-3 left-3 inline-block text-[0.6rem] tracking-[0.3em] uppercase border px-2.5 py-1 backdrop-blur-sm ${
                        item.kind === "event"
                          ? "border-copper/50 bg-ink/60 text-copper"
                          : "border-gold/40 bg-ink/60 text-gold"
                      }`}
                    >
                      {item.kind === "event" ? "Event" : "Journal"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-copper text-[0.66rem] tracking-[0.25em] uppercase">
                      <span>{item.dateLabel}</span>
                      {item.aside && (
                        <>
                          <span className="w-1 h-1 rotate-45 bg-copper/60" />
                          <span>{item.aside}</span>
                        </>
                      )}
                    </p>
                    <h3 className="font-display text-xl text-porcelain mt-3 leading-snug text-balance group-hover:text-gold-bright transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm text-cream-dim/75 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
