import { NextResponse } from "next/server";
import {
  getServiceClient,
  isMissingColumn,
  type ArtworkRow,
} from "../../../lib/supabase";
import { draftToRow, rowToArtwork } from "../../../lib/galleryMap";
import type { ArtworkDraft } from "../../../data/artworks";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/gallery/items:", error);
    return NextResponse.json({ error: "Could not load the gallery." }, { status: 500 });
  }

  return NextResponse.json({
    items: (data as ArtworkRow[]).map(rowToArtwork),
  });
}

export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  let draft: ArtworkDraft;
  try {
    draft = (await request.json()) as ArtworkDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!draft?.title?.trim() || !draft?.slug?.trim() || !draft?.image?.trim()) {
    return NextResponse.json(
      { error: "title, slug and image are required" },
      { status: 400 },
    );
  }

  // New items surface at the top of the gallery.
  const { data: first } = await supabase
    .from("artworks")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("artworks")
    .insert({
      ...draftToRow(draft),
      sort_order: (first?.sort_order ?? 0) - 1,
    })
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (!conflict) console.error("POST /api/gallery/items:", error);
    if (isMissingColumn(error)) {
      return NextResponse.json(
        { error: "The database is missing a column this version needs — re-run supabase/schema.sql." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        error: conflict
          ? "That slug is already used by another artwork."
          : "Could not save the artwork.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ item: rowToArtwork(data as ArtworkRow) }, { status: 201 });
}
