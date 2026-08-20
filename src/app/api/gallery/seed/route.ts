import { NextResponse } from "next/server";
import { getServiceClient } from "../../../lib/supabase";
import { artworks } from "../../../data/artworks";
import { draftToRow } from "../../../lib/galleryMap";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

/**
 * Loads a handful of demo artworks so the client can see the shape of a
 * finished entry. These point at bundled /public assets rather than the
 * storage bucket, so deleting them costs nothing and leaves no orphans.
 */
const DEMO_SLUGS = [
  "robert",
  "communion",
  "shadow-walker",
  "songbird",
  "french-village",
  "autumn-creek",
];

export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const { count } = await supabase
    .from("artworks")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "The gallery already has artworks — seeding was skipped." },
      { status: 409 },
    );
  }

  const rows = DEMO_SLUGS.map((slug, index) => {
    const source = artworks.find((item) => item.slug === slug);
    if (!source) return null;
    return { ...draftToRow(source), sort_order: index };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  const { data, error } = await supabase.from("artworks").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 201 });
}
