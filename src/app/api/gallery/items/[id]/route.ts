import { NextResponse } from "next/server";
import {
  getServiceClient,
  isMissingColumn,
  ARTWORK_BUCKET,
  type ArtworkRow,
} from "../../../../lib/supabase";
import {
  draftToRow,
  isStoredImage,
  rowToArtwork,
  storagePath,
} from "../../../../lib/galleryMap";
import type { ArtworkDraft } from "../../../../data/artworks";
import { guardAdmin } from "../../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
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

  let body: Partial<ArtworkDraft>;
  try {
    body = (await request.json()) as Partial<ArtworkDraft>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("PATCH /api/gallery/items/[id] (read):", readError);
    return NextResponse.json({ error: "Could not load the artwork." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  const current = rowToArtwork(existing as ArtworkRow);
  const merged: ArtworkDraft = { ...current, ...body };
  const previousImage = current.image;

  const { data, error } = await supabase
    .from("artworks")
    .update(draftToRow(merged))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (!conflict) console.error("PATCH /api/gallery/items/[id]:", error);
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

  // The replaced file is now unreferenced — drop it so storage doesn't grow
  // by one orphan every time the admin swaps an image.
  if (
    isStoredImage(previousImage) &&
    previousImage !== merged.image &&
    supabase
  ) {
    await supabase.storage
      .from(ARTWORK_BUCKET)
      .remove([storagePath(previousImage)]);
  }

  return NextResponse.json({ item: rowToArtwork(data as ArtworkRow) });
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
    .from("artworks")
    .select("image")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("artworks").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/gallery/items/[id]:", error);
    return NextResponse.json({ error: "Could not delete the artwork." }, { status: 500 });
  }

  const image = (existing as { image?: string } | null)?.image;
  if (image && isStoredImage(image)) {
    await supabase.storage.from(ARTWORK_BUCKET).remove([storagePath(image)]);
  }

  return NextResponse.json({ ok: true });
}
