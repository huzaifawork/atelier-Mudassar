import { NextResponse } from "next/server";
import { getPublicClient, getServiceClient } from "../../../lib/supabase";
import { defaultSettings, type GallerySettings } from "../../../data/artworks";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  // Public, unauthenticated route — use the anon client so RLS actually
  // applies, rather than the service_role client the write path below needs.
  const supabase = getPublicClient();
  if (!supabase) return NextResponse.json({ settings: defaultSettings });

  const { data } = await supabase
    .from("gallery_settings")
    .select("eyebrow, heading")
    .eq("id", true)
    .maybeSingle();

  return NextResponse.json({
    settings: (data as GallerySettings | null) ?? defaultSettings,
  });
}

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

  let body: GallerySettings;
  try {
    body = (await request.json()) as GallerySettings;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gallery_settings")
    .update({
      eyebrow: body.eyebrow?.trim() || defaultSettings.eyebrow,
      heading: body.heading?.trim() || defaultSettings.heading,
    })
    .eq("id", true)
    .select("eyebrow, heading")
    .single();

  if (error) {
    console.error("PUT /api/gallery/settings:", error);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }

  return NextResponse.json({ settings: data as GallerySettings });
}
