import { ARTWORK_BUCKET } from "../../../lib/supabase";
import { handleImageDelete, handleImageUpload } from "../../../lib/imageUpload";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guardAdmin(request, { limit: 20, windowMs: 60_000 });
  if (denied) return denied;

  return handleImageUpload(request, ARTWORK_BUCKET);
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
