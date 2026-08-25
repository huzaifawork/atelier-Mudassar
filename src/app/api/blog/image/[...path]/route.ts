import { BLOG_BUCKET } from "../../../../lib/supabase";
import { serveBucketImage } from "../../../../lib/imageUpload";
import { clientIp, rateLimit, tooManyRequests } from "../../../../lib/rateLimit";

/** Streams a blog cover out of the private bucket — see the gallery's
 *  equivalent route for why images don't go straight to Supabase. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const limited = rateLimit(`blog-image:${clientIp(request)}`, 120, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  const { path } = await params;
  return serveBucketImage(path, BLOG_BUCKET);
}
