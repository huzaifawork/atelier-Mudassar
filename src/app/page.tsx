import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Statement from "./components/Statement";
import Gallery from "./components/Gallery";
import Process from "./components/Process";
import Contact from "./components/Contact";
import ScrollProgress from "./components/ScrollProgress";
import JournalTeaser, { type TeaserItem } from "./components/JournalTeaser";
import { GalleryProvider } from "./lib/galleryStore";
import { fetchGallery } from "./lib/galleryServer";
import { fetchPublishedPosts } from "./lib/blogServer";
import { fetchPublishedEvents } from "./lib/eventsServer";
import { coverSrcFor } from "./lib/blogMap";
import { eventDisplaySrc } from "./lib/eventsMap";
import { excerptFor, formatPostDate, readingMinutes } from "./data/blog";
import { coverOf, excerptForEvent, formatEventDate } from "./data/events";

/** How many of the newest journal entries and events the landing page shows. */
const TEASER_COUNT = 3;

// Admin edits should show up on the next visit without a redeploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Independent of each other, so fetched together rather than in sequence.
  const [{ items, settings }, posts, events] = await Promise.all([
    fetchGallery(),
    fetchPublishedPosts(),
    fetchPublishedEvents(),
  ]);

  // Posts and events are flattened to one shape here, on the server, so the
  // teaser never has to know which kind of record it is drawing.
  const teasers: TeaserItem[] = [
    ...posts.map((post) => ({
      kind: "post" as const,
      key: `post-${post.id}`,
      href: `/journal/${post.slug}`,
      title: post.title,
      excerpt: excerptFor(post, 150),
      cover: post.coverImage ? coverSrcFor(post.coverImage) : undefined,
      sortDate: new Date(post.publishedAt).getTime(),
      dateLabel: formatPostDate(post.publishedAt),
      aside: `${readingMinutes(post.body)} min read`,
    })),
    ...events.map((event) => {
      const cover = coverOf(event);
      return {
        kind: "event" as const,
        key: `event-${event.id}`,
        href: `/events/${event.slug}`,
        title: event.title,
        excerpt: excerptForEvent(event, 150),
        cover: cover ? eventDisplaySrc(cover) : undefined,
        // A bare date has no timezone; read as UTC so it cannot slip a day.
        sortDate: new Date(`${event.eventDate}T00:00:00Z`).getTime(),
        dateLabel: formatEventDate(event.eventDate),
        aside: event.location,
      };
    }),
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, TEASER_COUNT);

  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />
      <Hero />
      <About />
      <Statement />
      <GalleryProvider initialItems={items} initialSettings={settings}>
        <Gallery />
      </GalleryProvider>
      <Process />
      <JournalTeaser items={teasers} />
      <Contact />
    </>
  );
}
