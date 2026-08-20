import { NextResponse } from "next/server";
import { getServiceClient, ARTWORK_BUCKET } from "../../../lib/supabase";
import { STORAGE_PREFIX, isStoredImage, storagePath } from "../../../lib/galleryMap";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — comfortably above a large PNG export.
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/** Verifies the leading bytes match the claimed image type. */
function matchesSignature(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length < 12) return false;
  switch (mime) {
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      // "RIFF" .... "WEBP"
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    case "image/avif":
      // ISO-BMFF box: "ftyp" at offset 4, brand "avif"/"avis" at 8.
      return (
        startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4) &&
        (startsWith(bytes, [0x61, 0x76, 0x69, 0x66], 8) ||
          startsWith(bytes, [0x61, 0x76, 0x69, 0x73], 8))
      );
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const denied = await guardAdmin(request, { limit: 20, windowMs: 60_000 });
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a PNG, JPEG, WebP or AVIF image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is larger than 25 MB." },
      { status: 413 },
    );
  }

  // The declared Content-Type comes from the client and can be anything, so
  // confirm the bytes really are the image format they claim to be. Without
  // this, an arbitrary file could be parked in the bucket under an image name.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, file.type)) {
    return NextResponse.json(
      { error: "That file doesn't look like a valid image." },
      { status: 415 },
    );
  }

  const extension = EXTENSIONS[file.type] ?? "png";
  // Random name, never the user-supplied filename: no traversal, no collisions,
  // and nothing guessable from the outside.
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("POST /api/gallery/upload:", error);
    return NextResponse.json({ error: "Could not upload the image." }, { status: 500 });
  }

  return NextResponse.json({ image: `${STORAGE_PREFIX}${path}` }, { status: 201 });
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

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  let body: { image?: string };
  try {
    body = (await request.json()) as { image?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const image = body.image?.trim() ?? "";
  if (!isStoredImage(image)) {
    return NextResponse.json({ error: "Not a stored image" }, { status: 400 });
  }

  await supabase.storage.from(ARTWORK_BUCKET).remove([storagePath(image)]);
  return NextResponse.json({ ok: true });
}
