"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { excerptFor, formatPostDate, readingMinutes, type BlogPost } from "../../data/blog";
import { coverSrcFor } from "../../lib/blogMap";
import ConfirmDialog from "../ConfirmDialog";

const action =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<BlogPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/blog/posts", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { posts?: BlogPost[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setPosts(data.posts ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load posts.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(id: string, work: () => Promise<unknown>) {
    setBusy(id);
    setNotice(null);
    try {
      await work();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function togglePublished(post: BlogPost) {
    const published = !post.published;
    const res = await fetch(`/api/blog/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to update the post.");
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, published } : p)),
    );
  }

  async function remove(id: string) {
    const res = await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to delete the post.");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-porcelain">Blog</h1>
          <p className="text-sm text-cream-dim/60 mt-1">
            {loaded
              ? `${publishedCount} published${
                  posts.length > publishedCount
                    ? ` · ${posts.length - publishedCount} draft${
                        posts.length - publishedCount === 1 ? "" : "s"
                      }`
                    : ""
                }`
              : "Loading…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="px-5 py-3 text-xs tracking-[0.2em] uppercase border border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright transition-colors"
          >
            View journal
          </Link>
          <Link
            href="/admin/blog/new"
            className="px-5 py-3 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors"
          >
            + Write a post
          </Link>
        </div>
      </div>

      {(error || notice) && (
        <p className="mb-6 border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
          {error ?? notice}
        </p>
      )}

      {loaded && posts.length === 0 && !error && (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">No posts yet</p>
          <p className="text-sm text-cream-dim/60 mt-2 max-w-md mx-auto">
            Write the first entry for the journal. A title and the post itself
            are all that&rsquo;s required — a cover image is optional.
          </p>
          <Link
            href="/admin/blog/new"
            className="inline-block mt-6 px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors"
          >
            Write a post
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {posts.map((post) => (
          <li
            key={post.id}
            className="grid grid-cols-[76px_1fr] sm:grid-cols-[110px_1fr_auto] gap-4 items-start border border-gold/15 bg-espresso/40 p-3 hover:border-gold/30 transition-colors"
          >
            <div className="relative aspect-16/10 w-full bg-espresso overflow-hidden flex items-center justify-center border border-gold/10">
              {post.coverImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={coverSrcFor(post.coverImage)}
                  alt=""
                  className="w-full h-full object-cover"
                  onContextMenu={(event) => event.preventDefault()}
                />
              ) : (
                <span className="font-display text-2xl text-gold/30 select-none">
                  {post.title.trim().charAt(0).toUpperCase() || "A"}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg text-porcelain truncate">
                  {post.title}
                </p>
                {!post.published && (
                  <span className="shrink-0 px-2 py-0.5 text-[0.58rem] tracking-[0.2em] uppercase border border-copper/50 text-copper">
                    Draft
                  </span>
                )}
              </div>

              <p className="text-copper text-[0.68rem] tracking-[0.2em] uppercase mt-1">
                {formatPostDate(post.publishedAt)} · {readingMinutes(post.body)} min read
              </p>

              <p className="text-xs text-cream-dim/60 mt-1.5 truncate">/blog/{post.slug}</p>

              <p className="text-sm text-cream-dim/70 mt-2 line-clamp-2">
                {excerptFor(post)}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-2 sm:justify-end sm:max-w-[15rem]">
              <Link
                href={`/admin/blog/${post.id}/edit`}
                className={`${action} border-gold/40 text-gold-bright hover:bg-gold hover:text-ink`}
              >
                Edit
              </Link>
              {post.published && (
                <Link
                  href={`/blog/${post.slug}`}
                  className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright`}
                >
                  View
                </Link>
              )}
              <button
                onClick={() => run(post.id, () => togglePublished(post))}
                disabled={busy === post.id}
                className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-40`}
              >
                {post.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => setConfirming(post)}
                className={`${action} border-copper/40 text-copper hover:bg-copper hover:text-ink`}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {confirming && (
        <ConfirmDialog
          title={`Delete "${confirming.title}"?`}
          description="This removes the post from the journal and deletes its cover image. It can't be undone."
          confirmLabel="Delete post"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const target = confirming;
            setConfirming(null);
            void run(target.id, () => remove(target.id));
          }}
        />
      )}
    </>
  );
}
