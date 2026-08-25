import Link from "next/link";
import Navbar from "../../components/Navbar";
import SiteFooter from "../../components/SiteFooter";

/** Shown for a slug that doesn't exist — and for drafts, which the public
 *  read filters out, so an unpublished post is indistinguishable from one
 *  that was never written. */
export default function PostNotFound() {
  return (
    <>
      <div className="grain" />
      <Navbar />

      <main className="relative bg-ink min-h-screen flex items-center justify-center px-6 py-40 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(205,163,95,0.10),transparent_60%)]" />

        <div className="relative text-center max-w-lg">
          <span className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/50" />
            <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
            <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/50" />
          </span>

          <h1 className="font-display text-3xl sm:text-4xl text-porcelain mt-7">
            This entry isn&rsquo;t here
          </h1>
          <p className="text-cream-dim/75 mt-4 leading-relaxed">
            The page may have been moved, or the entry hasn&rsquo;t been
            published yet.
          </p>

          <Link
            href="/blog"
            className="inline-block mt-9 px-6 py-3 text-[0.72rem] tracking-[0.25em] uppercase border border-gold/50 text-gold hover:bg-gold hover:text-ink transition-all duration-300"
          >
            Back to the Journal
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
