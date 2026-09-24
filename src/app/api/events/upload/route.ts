import { EVENT_BUCKET } from "../../../lib/supabase";
import {
  handleImageDelete,
  handleSignedUploadUrl,
  handleUploadVerify,
} from "../../../lib/imageUpload";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

/**
 * One endpoint, three stages of a single event photograph upload.
 *
 * Same arrangement as /api/gallery/upload, and for the same reason: the file
 * never passes through here, because a Vercel function's request body is
 * capped at 4.5 MB and the platform rejects anything larger with a 413 before
 * the handler runs. Photographs off a phone or a camera go past that easily,
 * so the bytes go straight from the browser to Supabase and this route only
 * brackets the transfer.
 */

/** Stage 1 — hand back a signed URL the browser can upload to. */
export async function POST(request: Request) {
  // Generous because a gallery is uploaded in bulk: each picture costs four
  // requests here (sign then verify, for the original and again for the
  // web-sized copy), so a dozen at once is already approaching fifty.
  const denied = await guardAdmin(request, { limit: 150, windowMs: 60_000 });
  if (denied) return denied;

  return handleSignedUploadUrl(request, EVENT_BUCKET);
}

/** Stage 2 — confirm what landed really is the image it claimed to be. */
export async function PUT(request: Request) {
  // Generous because a gallery is uploaded in bulk: each picture costs four
  // requests here (sign then verify, for the original and again for the
  // web-sized copy), so a dozen at once is already approaching fifty.
  const denied = await guardAdmin(request, { limit: 150, windowMs: 60_000 });
  if (denied) return denied;

  return handleUploadVerify(request, EVENT_BUCKET);
}

/**
 * Removes a picture that was uploaded but never saved onto an event — the
 * form uploads first so it has something to show, and a failed save
 * afterwards would otherwise leave the object in the bucket forever.
 */
export async function DELETE(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  return handleImageDelete(request, EVENT_BUCKET);
}
