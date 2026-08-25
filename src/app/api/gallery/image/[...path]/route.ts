import { ARTWORK_BUCKET } from "../../../../lib/supabase";
import { serveBucketImage } from "../../../../lib/imageUpload";
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

  const { path } = await params;
  return serveBucketImage(path, ARTWORK_BUCKET);
}
