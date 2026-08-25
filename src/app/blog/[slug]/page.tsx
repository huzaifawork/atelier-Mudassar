import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import SiteFooter from "../../components/SiteFooter";
import ScrollProgress from "../../components/ScrollProgress";
import CoverArt from "../../components/blog/CoverArt";
import { fetchPostBySlug, fetchPublishedPosts } from "../../lib/blogServer";
import {
  excerptFor,
  formatPostDate,
  paragraphsOf,
  readingMinutes,
} from "../../data/blog";

// Admin edits should show up on the next visit without a redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) return { title: "Post not found — Atelier Mudassar" };

  return {
    title: `${post.title} — The Journal`,
    description: excerptFor(post, 155),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  // Drafts are filtered out by the read, so an unpublished post 404s here
  // exactly like one that never existed.
  if (!post) notFound();

  const paragraphs = paragraphsOf(post.body);
  const more = (await fetchPublishedPosts())
    .filter((other) => other.id !== post.id)
    .slice(0, 3);

  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />

      <main className="relative bg-ink overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(205,163,95,0.10),transparent_60%)]" />

        <article className="relative max-w-3xl mx-auto px-6 sm:px-10 pt-36 sm:pt-44 pb-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] uppercase text-cream-dim/70 hover:text-gold-bright transition-colors"
          >
            <span aria-hidden>←</span> The Journal
          </Link>

          <header className="mt-8 animate-fade-up">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-copper text-[0.68rem] tracking-[0.25em] uppercase">
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>
              <span className="w-1 h-1 rotate-45 bg-copper/60" />
              <span>{readingMinutes(post.body)} min read</span>
            </p>

            <h1 className="font-display text-3xl sm:text-5xl text-porcelain mt-5 leading-[1.15] text-balance">
              {post.title}
            </h1>

            {post.excerpt.trim() && (
              <p className="font-accent italic text-lg sm:text-xl text-cream-dim/85 mt-6 leading-relaxed text-balance">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 mt-8">
              <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
              <span className="h-px w-20 bg-linear-to-r from-gold/60 to-transparent" />
            </div>
          </header>

          {/* Optional cover. Posts written without one open straight into the
              text rather than showing a placeholder. */}
          {post.coverImage && (
            <figure className="relative aspect-16/9 w-full mt-12 overflow-hidden">
              <CoverArt
                cover={post.coverImage}
                title={post.title}
                sizes="(max-width: 768px) 92vw, 768px"
                priority
              />
              <span className="absolute inset-0 ring-1 ring-inset ring-gold/15" />
            </figure>
          )}

          {/* Plain text rendered as text nodes — an admin can't inject markup. */}
          <div className="mt-12 space-y-6">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`text-cream-dim/90 leading-loose text-base sm:text-[1.05rem] whitespace-pre-line ${
                  index === 0
                    ? "first-letter:font-display first-letter:text-5xl first-letter:text-gold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none"
                    : ""
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-gold/10 flex flex-wrap items-center justify-between gap-4">
            <p className="font-accent italic text-gold-bright text-lg">
              — Mudassar Ghaffar
            </p>
            <Link
              href="/blog"
              className="text-[0.7rem] tracking-[0.25em] uppercase border border-gold/40 text-gold px-5 py-3 hover:bg-gold hover:text-ink transition-all duration-300"
            >
              All entries
            </Link>
          </div>
        </article>

        {more.length > 0 && (
          <section className="relative bg-espresso/40 border-t border-gold/10 px-6 sm:px-10 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-5 mb-8">
                <span className="text-copper text-[0.62rem] tracking-[0.35em] uppercase whitespace-nowrap">
                  Keep reading
                </span>
                <span className="h-px grow bg-linear-to-r from-gold/25 to-transparent" />
              </div>

              <ul className="grid sm:grid-cols-3 gap-6">
                {more.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/blog/${other.slug}`}
                      className="group flex flex-col h-full border border-gold/15 bg-ink/40 p-5 hover:border-gold/40 transition-colors duration-500"
                    >
                      <time
                        dateTime={other.publishedAt}
                        className="text-copper text-[0.62rem] tracking-[0.25em] uppercase"
                      >
                        {formatPostDate(other.publishedAt)}
                      </time>
                      <h2 className="font-display text-lg text-porcelain mt-2.5 leading-snug group-hover:text-gold-bright transition-colors">
                        {other.title}
                      </h2>
                      <p className="text-sm text-cream-dim/70 mt-2.5 leading-relaxed">
                        {excerptFor(other, 110)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
