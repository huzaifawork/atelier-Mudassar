import "server-only";
import { NextResponse } from "next/server";
import { getServiceClient } from "./supabase";
import { STORAGE_PREFIX, isStoredImage, storagePath } from "./galleryMap";

/**
 * Shared upload/cleanup handling for the private image buckets.
 *
 * The gallery and the blog both accept admin-uploaded images, and the checks
 * that matter — size, declared type, and the actual magic bytes — must not be
 * allowed to drift apart between them, so they live here once.
 *
 * Callers are responsible for guardAdmin() before calling in; nothing in this
 * module authenticates.
 */

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

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

/**
 * Reads the multipart body, validates the file, and stores it under a random
 * name in `bucket`. Responds with `{ image: "storage:<path>" }`.
 */
export async function handleImageUpload(
  request: Request,
  bucket: string,
): Promise<Response> {
  const supabase = getServiceClient();
  if (!supabase) return noClient();

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
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error(`upload to ${bucket}:`, error);
    return NextResponse.json({ error: "Could not upload the image." }, { status: 500 });
  }

  return NextResponse.json({ image: `${STORAGE_PREFIX}${path}` }, { status: 201 });
}

/**
 * Removes an uploaded-but-never-saved object — the admin forms upload first
 * (so they have something to preview and a reference to save), and a failed
 * save afterwards would otherwise leave the object in the bucket forever.
 */
export async function handleImageDelete(
  request: Request,
  bucket: string,
): Promise<Response> {
  const supabase = getServiceClient();
  if (!supabase) return noClient();

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

  await supabase.storage.from(bucket).remove([storagePath(image)]);
  return NextResponse.json({ ok: true });
}

/**
 * Streams an object out of a private bucket.
 *
 * Object names are unguessable UUIDs, so this isn't gating access — going
 * through our own route keeps the storage location unexposed and gives one
 * place to add auth later.
 */
export async function serveBucketImage(
  path: string[],
  bucket: string,
): Promise<Response> {
  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const objectPath = path.join("/");

  // Reject traversal attempts outright rather than trusting the bucket API.
  if (objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
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
