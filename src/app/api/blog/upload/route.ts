import { BLOG_BUCKET } from "../../../lib/supabase";
import { handleImageDelete, handleImageUpload } from "../../../lib/imageUpload";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guardAdmin(request, { limit: 20, windowMs: 60_000 });
  if (denied) return denied;

  return handleImageUpload(request, BLOG_BUCKET);
}

/** Removes a cover that was uploaded but never attached to a saved post. */
export async function DELETE(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  return handleImageDelete(request, BLOG_BUCKET);
}
