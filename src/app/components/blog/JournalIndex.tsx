"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  excerptFor,
  formatPostDate,
  readingMinutes,
  type BlogPost,
} from "../../data/blog";
import CoverArt from "./CoverArt";

const ease = [0.16, 1, 0.3, 1] as const;

function Meta({ post }: { post: BlogPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-copper text-[0.68rem] tracking-[0.25em] uppercase">
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      <span className="w-1 h-1 rotate-45 bg-copper/60" />
      <span>{readingMinutes(post.body)} min read</span>
    </p>
  );
}

/** The newest post, given the room of a spread. */
function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease }}
      className="group relative"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center border border-gold/15 bg-espresso/40 p-5 sm:p-7 transition-colors duration-500 hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
      >
        <div className="relative aspect-16/10 w-full overflow-hidden">
          <CoverArt
            cover={post.coverImage}
            title={post.title}
            sizes="(max-width: 1024px) 92vw, 55vw"
            priority
            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <span className="absolute inset-0 ring-1 ring-inset ring-gold/10" />
        </div>

        <div>
          <span className="inline-block text-gold text-[0.62rem] tracking-[0.35em] uppercase border border-gold/30 px-3 py-1.5">
            Latest
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-porcelain mt-5 leading-tight text-balance group-hover:text-gold-bright transition-colors duration-300">
            {post.title}
          </h2>
          <div className="mt-4">
            <Meta post={post} />
          </div>
          <p className="mt-5 text-cream-dim/85 leading-relaxed">
            {excerptFor(post, 260)}
          </p>
          <span className="mt-7 inline-flex items-center gap-3 text-[0.72rem] tracking-[0.25em] uppercase text-gold">
            Read the entry
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease, delay: Math.min(index, 3) * 0.06 }}
      className="group"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-col h-full border border-gold/15 bg-espresso/30 transition-colors duration-500 hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <CoverArt
            cover={post.coverImage}
            title={post.title}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col grow p-6">
          <Meta post={post} />
          <h3 className="font-display text-xl sm:text-2xl text-porcelain mt-3 leading-snug text-balance group-hover:text-gold-bright transition-colors duration-300">
            {post.title}
          </h3>
          <p className="mt-3 text-sm text-cream-dim/75 leading-relaxed">
            {excerptFor(post)}
          </p>
          <span className="mt-6 pt-4 border-t border-gold/10 inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.25em] uppercase text-gold/90">
            Read
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default function JournalIndex({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="border border-gold/15 bg-espresso/30 px-6 py-20 text-center"
      >
        <span className="inline-flex items-center gap-3">
          <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/50" />
          <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
          <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/50" />
        </span>
        <p className="font-display text-2xl text-porcelain mt-6">
          The first entry is still being written
        </p>
        <p className="text-cream-dim/70 mt-3 max-w-md mx-auto leading-relaxed">
          Notes from the studio — on process, materials, and the thinking behind
          the work — will appear here soon.
        </p>
        <Link
          href="/#gallery"
          className="inline-block mt-8 px-6 py-3 text-[0.72rem] tracking-[0.25em] uppercase border border-gold/50 text-gold hover:bg-gold hover:text-ink transition-all duration-300"
        >
          Visit the gallery
        </Link>
      </motion.div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <>
      <FeaturedPost post={featured} />

      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-5 mt-20 mb-10">
            <span className="text-copper text-[0.62rem] tracking-[0.35em] uppercase whitespace-nowrap">
              More entries
            </span>
            <span className="h-px grow bg-linear-to-r from-gold/25 to-transparent" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
