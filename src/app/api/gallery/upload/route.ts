import { ARTWORK_BUCKET } from "../../../lib/supabase";
import {
  handleImageDelete,
  handleSignedUploadUrl,
  handleUploadVerify,
} from "../../../lib/imageUpload";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

/**
 * One endpoint, three stages of a single artwork upload.
 *
 * The file itself never passes through here. It used to — the form POSTed the
 * image as multipart and this route wrote it to the bucket — but a Vercel
 * function's request body is capped at 4.5 MB, and the platform rejects
 * anything larger with a 413 before the handler is even invoked. Full
 * resolution artwork is routinely well past that, so the bytes now go straight
 * from the browser to Supabase and this route only brackets that transfer.
 */

/** Stage 1 — hand back a signed URL the browser can upload to. */
export async function POST(request: Request) {
  const denied = await guardAdmin(request, { limit: 20, windowMs: 60_000 });
  if (denied) return denied;

  return handleSignedUploadUrl(request, ARTWORK_BUCKET);
}

/** Stage 2 — confirm what landed really is the image it claimed to be. */
export async function PUT(request: Request) {
  const denied = await guardAdmin(request, { limit: 20, windowMs: 60_000 });
  if (denied) return denied;

  return handleUploadVerify(request, ARTWORK_BUCKET);
}

/**
 * Cleans up an uploaded-but-never-saved image — the admin form uploads the
 * file first (so it has a URL to preview and save with the artwork), and if
 * the subsequent create/update call then fails, the object it just wrote
 * would otherwise sit in the bucket forever with nothing referencing it.
 */
export async function DELETE(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  return handleImageDelete(request, ARTWORK_BUCKET);
}
