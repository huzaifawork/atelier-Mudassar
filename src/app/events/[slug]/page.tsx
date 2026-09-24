import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import SiteFooter from "../../components/SiteFooter";
import ScrollProgress from "../../components/ScrollProgress";
import { fetchEventBySlug, fetchPublishedEvents } from "../../lib/eventsServer";
import { eventDisplaySrc, eventRatioOf } from "../../lib/eventsMap";
import {
  coverOf,
  excerptForEvent,
  formatEventDate,
  isSafeLinkUrl,
  labelForLink,
  paragraphsOfEvent,
} from "../../data/events";

// Admin edits should show up on the next visit without a redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event) return { title: "Event not found — Atelier Mudassar" };

  return {
    title: `${event.title} — Atelier Mudassar`,
    description: excerptForEvent(event, 160),
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event) notFound();

  const cover = coverOf(event);
  const rest = event.images.slice(1);
  const paragraphs = paragraphsOfEvent(event.body);
  const links = event.links.filter((link) => isSafeLinkUrl(link.url));

  const others = (await fetchPublishedEvents())
    .filter((other) => other.slug !== event.slug)
    .slice(0, 3);

  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />

      <main className="relative bg-ink min-h-screen overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(205,163,95,0.10),transparent_60%)]" />

        <article className="relative max-w-4xl mx-auto px-6 sm:px-10 pt-36 sm:pt-44 pb-24">
          <Link
            href="/journal"
            className="text-xs tracking-[0.25em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
          >
            ← Journal &amp; Events
          </Link>

          <header className="mt-8">
            <span className="inline-block text-[0.6rem] tracking-[0.3em] uppercase border border-copper/50 text-copper px-2.5 py-1">
              Event
            </span>
            <h1 className="font-display text-4xl sm:text-5xl text-porcelain mt-5 leading-tight text-balance">
              {event.title}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-copper text-[0.7rem] tracking-[0.25em] uppercase mt-5">
              <time dateTime={event.eventDate}>{formatEventDate(event.eventDate)}</time>
              {event.location && (
                <>
                  <span className="w-1 h-1 rotate-45 bg-copper/60" />
                  <span>{event.location}</span>
                </>
              )}
            </p>
            {event.summary.trim() && (
              <p className="font-accent italic text-lg sm:text-xl text-cream-dim/85 mt-6 leading-relaxed text-balance">
                {event.summary.trim()}
              </p>
            )}
          </header>

          {cover && (
            <div
              className="relative w-full overflow-hidden bg-espresso mt-10"
              style={{ aspectRatio: eventRatioOf(cover) ?? 16 / 10 }}
            >
              <Image
                src={eventDisplaySrc(cover)}
                alt={event.title}
                fill
                sizes="(max-width: 1024px) 92vw, 56rem"
                priority
                className="object-cover"
              />
              <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
            </div>
          )}

          {paragraphs.length > 0 && (
            <div className="mt-10 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-cream-dim/90 leading-loose text-[1.02rem] whitespace-pre-line"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Where it was published                                      */}
          {/* ---------------------------------------------------------- */}
          {links.length > 0 && (
            <section className="mt-12 border-t border-gold/15 pt-8">
              <h2 className="text-copper text-[0.65rem] tracking-[0.35em] uppercase">
                Published at
              </h2>
              <ul className="flex flex-wrap gap-3 mt-4">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      // noopener/noreferrer because these point off-site to
                      // wherever the coverage lives.
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 border border-gold/30 px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-cream-dim hover:border-gold hover:text-gold-bright transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
                    >
                      {labelForLink(link)}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                        className="w-3.5 h-3.5"
                      >
                        <path d="M15 3h6v6M21 3l-9 9" strokeLinecap="round" />
                        <path d="M19 14v6H4V5h6" strokeLinecap="round" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------------------------------------------------------- */}
          {/* The rest of the photographs                                 */}
          {/* ---------------------------------------------------------- */}
          {rest.length > 0 && (
            <section className="mt-12 border-t border-gold/15 pt-8">
              <h2 className="text-copper text-[0.65rem] tracking-[0.35em] uppercase">
                Photographs
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-5 items-start">
                {rest.map((picture, index) => (
                  <div
                    key={picture.image}
                    className="relative w-full overflow-hidden bg-espresso"
                    style={{ aspectRatio: eventRatioOf(picture) ?? 4 / 3 }}
                  >
                    <Image
                      src={eventDisplaySrc(picture)}
                      alt={`${event.title} — photograph ${index + 2}`}
                      fill
                      sizes="(max-width: 640px) 92vw, 28rem"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="mt-16 border-t border-gold/15 pt-8">
              <h2 className="text-copper text-[0.65rem] tracking-[0.35em] uppercase">
                More events
              </h2>
              <ul className="mt-5 space-y-3">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/events/${other.slug}`}
                      className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-gold/10 pb-3 hover:border-gold/30 transition-colors"
                    >
                      <span className="font-display text-lg text-porcelain group-hover:text-gold-bright transition-colors">
                        {other.title}
                      </span>
                      <span className="text-copper text-[0.65rem] tracking-[0.2em] uppercase">
                        {formatEventDate(other.eventDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
