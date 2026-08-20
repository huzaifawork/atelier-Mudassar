import { NextResponse } from "next/server";
import { getServiceClient } from "../../../lib/supabase";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

/** Persists the gallery's display order from a full list of ids, in order. */
export async function PUT(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  let ids: string[];
  try {
    ({ ids } = (await request.json()) as { ids: string[] });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase.from("artworks").update({ sort_order: index }).eq("id", id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error("PUT /api/gallery/reorder:", failed.error);
    return NextResponse.json({ error: "Could not save the new order." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
