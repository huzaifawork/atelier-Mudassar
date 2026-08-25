import { NextResponse } from "next/server";
import {
  getServiceClient,
  BLOG_BUCKET,
  type BlogPostRow,
} from "../../../../lib/supabase";
import {
  draftToRow,
  isStoredImage,
  rowToPost,
  storagePath,
} from "../../../../lib/blogMap";
import type { BlogPostDraft } from "../../../../data/blog";
import { guardAdmin } from "../../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("GET /api/blog/posts/[id]:", error);
    return NextResponse.json({ error: "Could not load the post." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ post: rowToPost(data as BlogPostRow) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;

  let body: Partial<BlogPostDraft>;
  try {
    body = (await request.json()) as Partial<BlogPostDraft>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("PATCH /api/blog/posts/[id] (read):", readError);
    return NextResponse.json({ error: "Could not load the post." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const current = rowToPost(existing as BlogPostRow);
  const merged: BlogPostDraft = { ...current, ...body };
  const previousCover = current.coverImage;

  const { data, error } = await supabase
    .from("blog_posts")
    .update(draftToRow(merged))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (!conflict) console.error("PATCH /api/blog/posts/[id]:", error);
    return NextResponse.json(
      {
        error: conflict
          ? "That slug is already used by another post."
          : "Could not save the post.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  // The replaced (or removed) cover is now unreferenced — drop it so storage
  // doesn't grow by one orphan every time the admin swaps an image.
  if (previousCover && isStoredImage(previousCover) && previousCover !== merged.coverImage) {
    await supabase.storage.from(BLOG_BUCKET).remove([storagePath(previousCover)]);
  }

  return NextResponse.json({ post: rowToPost(data as BlogPostRow) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("cover_image")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/blog/posts/[id]:", error);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 500 });
  }

  const cover = (existing as { cover_image?: string | null } | null)?.cover_image;
  if (cover && isStoredImage(cover)) {
    await supabase.storage.from(BLOG_BUCKET).remove([storagePath(cover)]);
  }

  return NextResponse.json({ ok: true });
}
