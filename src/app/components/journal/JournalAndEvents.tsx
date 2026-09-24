"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  excerptFor,
  formatPostDate,
  readingMinutes,
  type BlogPost,
} from "../../data/blog";
import {
  coverOf,
  excerptForEvent,
  formatEventDate,
  type Event,
} from "../../data/events";
import { coverSrcFor } from "../../lib/blogMap";
import { eventDisplaySrc } from "../../lib/eventsMap";
import CoverArt from "./CoverArt";

const ease = [0.16, 1, 0.3, 1] as const;

type Kind = "post" | "event";
type Filter = "all" | Kind;

/**
 * One card's worth of either kind.
 *
 * Posts and events are different records with different fields, but the index
 * shows them on one timeline, so they are flattened to the handful of things
 * a card actually needs. Doing it once here keeps the card itself from
 * branching on kind in five different places.
 */
interface Entry {
  kind: Kind;
  key: string;
  href: string;
  title: string;
  excerpt: string;
  cover?: string;
  /** Sortable. Events carry a date, posts a timestamp. */
  sortDate: number;
  /** Already formatted for display. */
  dateLabel: string;
  /** The small line beside the date — reading time, or where it happened. */
  aside?: string;
}

function entryForPost(post: BlogPost): Entry {
  return {
    kind: "post",
    key: `post-${post.id}`,
    href: `/journal/${post.slug}`,
    title: post.title,
    excerpt: excerptFor(post, 200),
    cover: post.coverImage ? coverSrcFor(post.coverImage) : undefined,
    sortDate: new Date(post.publishedAt).getTime(),
    dateLabel: formatPostDate(post.publishedAt),
    aside: `${readingMinutes(post.body)} min read`,
  };
}

function entryForEvent(event: Event): Entry {
  const cover = coverOf(event);
  return {
    kind: "event",
    key: `event-${event.id}`,
    href: `/events/${event.slug}`,
    title: event.title,
    excerpt: excerptForEvent(event, 200),
    cover: cover ? eventDisplaySrc(cover) : undefined,
    // A bare date has no timezone; read as UTC so it can't land on the
    // previous day and shuffle ahead of a post it should follow.
    sortDate: new Date(`${event.eventDate}T00:00:00Z`).getTime(),
    dateLabel: formatEventDate(event.eventDate),
    aside: event.location,
  };
}

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "post", label: "Journal" },
  { key: "event", label: "Events" },
];

function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span
      className={`inline-block text-[0.6rem] tracking-[0.3em] uppercase border px-2.5 py-1 ${
        kind === "event"
          ? "border-copper/50 text-copper"
          : "border-gold/40 text-gold"
      }`}
    >
      {kind === "event" ? "Event" : "Journal"}
    </span>
  );
}

function Meta({ entry }: { entry: Entry }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-copper text-[0.68rem] tracking-[0.25em] uppercase">
      <span>{entry.dateLabel}</span>
      {entry.aside && (
        <>
          <span className="w-1 h-1 rotate-45 bg-copper/60" />
          <span>{entry.aside}</span>
        </>
      )}
    </p>
  );
}

/** The newest of whatever is being shown, given the room of a spread. */
function Featured({ entry }: { entry: Entry }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease }}
      className="group relative"
    >
      <Link
        href={entry.href}
        className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center border border-gold/15 bg-espresso/40 p-5 sm:p-7 transition-colors duration-500 hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
      >
        <div className="relative aspect-16/10 w-full overflow-hidden">
          <CoverArt
            src={entry.cover}
            title={entry.title}
            sizes="(max-width: 1024px) 92vw, 55vw"
            priority
            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <KindBadge kind={entry.kind} />
            <span className="inline-block text-gold text-[0.6rem] tracking-[0.3em] uppercase border border-gold/30 px-2.5 py-1">
              Latest
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-porcelain mt-5 leading-tight text-balance group-hover:text-gold-bright transition-colors duration-300">
            {entry.title}
          </h2>
          <div className="mt-4">
            <Meta entry={entry} />
          </div>
          <p className="mt-5 text-cream-dim/85 leading-relaxed">{entry.excerpt}</p>
          <span className="inline-flex items-center gap-3 mt-7 text-xs tracking-[0.25em] uppercase text-gold-bright">
            Read
            <span className="h-px w-10 bg-gold-bright/60 transition-all duration-500 group-hover:w-16" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function Card({ entry, index }: { entry: Entry; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, ease, delay: Math.min(index, 6) * 0.05 }}
      className="group"
    >
      <Link
        href={entry.href}
        className="flex h-full flex-col border border-gold/15 bg-espresso/40 transition-colors duration-500 hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
      >
        <div className="relative aspect-16/10 w-full overflow-hidden">
          <CoverArt
            src={entry.cover}
            title={entry.title}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
          <span className="absolute top-3 left-3">
            <KindBadge kind={entry.kind} />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <Meta entry={entry} />
          <h3 className="font-display text-xl text-porcelain mt-3 leading-snug text-balance group-hover:text-gold-bright transition-colors duration-300">
            {entry.title}
          </h3>
          <p className="mt-3 text-sm text-cream-dim/75 leading-relaxed">
            {entry.excerpt}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export default function JournalAndEvents({
  posts,
  events,
}: {
  posts: BlogPost[];
  events: Event[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const entries = useMemo(() => {
    const all = [...posts.map(entryForPost), ...events.map(entryForEvent)];
    return all.sort((a, b) => b.sortDate - a.sortDate);
  }, [posts, events]);

  const visible = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.kind === filter)),
    [entries, filter],
  );

  // Only offer a filter when there is something of both kinds to filter.
  const showFilters = posts.length > 0 && events.length > 0;

  if (entries.length === 0) {
    return (
      <div className="border border-gold/20 bg-espresso/40 px-6 py-16 text-center">
        <p className="font-display text-2xl text-porcelain">Nothing here yet</p>
        <p className="text-cream-dim/70 mt-3 max-w-md mx-auto">
          Writing from the studio and news of where the work has been shown
          will appear here.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = visible;

  return (
    <MotionConfig reducedMotion="user">
      {showFilters && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright ${
                filter === f.key
                  ? "border-gold bg-gold text-ink"
                  : "border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {featured && <Featured key={featured.key} entry={featured} />}

      {rest.length > 0 && (
        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-8 sm:mt-10 items-start"
        >
          <AnimatePresence mode="popLayout">
            {rest.map((entry, index) => (
              <Card key={entry.key} entry={entry} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </MotionConfig>
  );
}
