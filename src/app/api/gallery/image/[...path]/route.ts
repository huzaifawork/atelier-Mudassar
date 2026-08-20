import { NextResponse } from "next/server";
import { getServiceClient, ARTWORK_BUCKET } from "../../../../lib/supabase";
import { clientIp, rateLimit, tooManyRequests } from "../../../../lib/rateLimit";

/**
 * Streams an artwork out of the private bucket.
 *
 * Going through our own route (instead of handing the browser a Supabase URL)
 * keeps the storage location unexposed and gives one place to add auth or
 * rate limiting later. The path starts with "/" so next/image still optimises
 * the response.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // Object names are unguessable UUIDs, so this isn't gating access — it's
  // capping how many full-size downloads a single client can pull from
  // Supabase Storage per minute, since every request is billed egress.
  const limited = rateLimit(`gallery-image:${clientIp(request)}`, 120, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const { path } = await params;
  const objectPath = path.join("/");

  // Reject traversal attempts outright rather than trusting the bucket API.
  if (objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { data, error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .download(objectPath);

  if (error || !data) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "image/png",
      // Object names are UUIDs, so a stored image is immutable once written.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
