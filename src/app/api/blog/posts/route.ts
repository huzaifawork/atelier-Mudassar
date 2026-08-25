import { NextResponse } from "next/server";
import { getServiceClient, type BlogPostRow } from "../../../lib/supabase";
import { draftToRow, rowToPost } from "../../../lib/blogMap";
import type { BlogPostDraft } from "../../../data/blog";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

/** Admin listing — includes drafts, which the public read never sees. */
export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("GET /api/blog/posts:", error);
    return NextResponse.json({ error: "Could not load the posts." }, { status: 500 });
  }

  return NextResponse.json({ posts: (data as BlogPostRow[]).map(rowToPost) });
}

export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  let draft: BlogPostDraft;
  try {
    draft = (await request.json()) as BlogPostDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!draft?.title?.trim() || !draft?.slug?.trim()) {
    return NextResponse.json(
      { error: "A title and slug are required." },
      { status: 400 },
    );
  }
  if (!draft?.body?.trim()) {
    return NextResponse.json({ error: "Write something in the post." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(draftToRow(draft))
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (!conflict) console.error("POST /api/blog/posts:", error);
    return NextResponse.json(
      {
        error: conflict
          ? "That slug is already used by another post."
          : "Could not save the post.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ post: rowToPost(data as BlogPostRow) }, { status: 201 });
}
