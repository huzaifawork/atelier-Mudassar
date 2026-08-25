"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import BlogForm from "../../BlogForm";
import type { BlogPost } from "../../../../data/blog";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/blog/posts/${id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { post?: BlogPost }) => {
        if (!cancelled && data.post) setPost(data.post);
      })
      .catch(() => {
        // Falls through to the "not found" panel below.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/blog"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Blog
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">
          {post ? `Edit “${post.title}”` : "Edit post"}
        </h1>
      </div>

      {!loaded ? (
        <p className="text-sm text-cream-dim/60">Loading…</p>
      ) : post ? (
        <BlogForm key={post.id} existing={post} />
      ) : (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">Post not found</p>
          <p className="text-sm text-cream-dim/60 mt-2">It may have been deleted.</p>
          <Link
            href="/admin/blog"
            className="inline-block mt-6 px-5 py-2.5 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            Back to blog
          </Link>
        </div>
      )}
    </>
  );
}
