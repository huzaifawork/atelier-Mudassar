import { EVENT_BUCKET } from "../../../../lib/supabase";
import { serveBucketImage } from "../../../../lib/imageUpload";
import { clientIp, rateLimit, tooManyRequests } from "../../../../lib/rateLimit";

/**
 * Streams an event photograph out of the private bucket.
 *
 * Mirrors /api/gallery/image: going through our own route keeps the storage
 * location unexposed, and the path starts with "/" so next/image can still
 * optimise the response.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // Object names are unguessable UUIDs, so this isn't gating access — it caps
  // how many full-size downloads one client can pull per minute, since every
  // request is billed egress.
  const limited = rateLimit(`events-image:${clientIp(request)}`, 120, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  const { path } = await params;
  return serveBucketImage(path, EVENT_BUCKET);
}
