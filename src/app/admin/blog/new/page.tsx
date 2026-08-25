import Link from "next/link";
import BlogForm from "../BlogForm";

export default function NewPostPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/blog"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Blog
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">Write a post</h1>
      </div>
      <BlogForm />
    </>
  );
}
