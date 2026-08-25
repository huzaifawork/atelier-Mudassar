import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import ScrollProgress from "../components/ScrollProgress";
import JournalIndex from "../components/blog/JournalIndex";
import { fetchPublishedPosts } from "../lib/blogServer";

// Admin edits should show up on the next visit without a redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Journal — Atelier Mudassar",
  description:
    "Notes from the studio of Mudassar Ghaffar — on process, materials, symbolism, and the thinking behind each digital painting.",
};

export default async function BlogPage() {
  const posts = await fetchPublishedPosts();

  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />

      <main className="relative bg-ink min-h-screen overflow-hidden">
        {/* Same atmospheric wash the landing sections use, so the journal
            reads as part of the same site rather than a bolted-on page. */}
        <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(205,163,95,0.10),transparent_60%)]" />
        <div className="absolute -right-40 top-64 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-40 sm:pt-48 pb-24">
          <header className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
            <span className="text-copper text-xs tracking-[0.4em] uppercase">
              Atelier Mudassar
            </span>
            <h1 className="font-display text-4xl sm:text-6xl text-porcelain mt-5">
              The <span className="text-gold">Journal</span>
            </h1>

            <div className="flex items-center justify-center gap-4 mt-7">
              <span className="h-px w-16 bg-linear-to-r from-transparent to-gold/50" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
              <span className="h-px w-16 bg-linear-to-l from-transparent to-gold/50" />
            </div>

            <p className="font-accent italic text-lg sm:text-xl text-cream-dim/85 mt-7 leading-relaxed text-balance">
              Notes from the studio — on process, materials, symbolism, and the
              thinking behind each piece.
            </p>
          </header>

          <JournalIndex posts={posts} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
