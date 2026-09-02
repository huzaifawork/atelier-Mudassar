import "server-only";
import { NextResponse } from "next/server";
import { getServiceClient, getStorageRest } from "./supabase";
import { STORAGE_PREFIX, isStoredImage, storagePath } from "./galleryMap";
import {
  ALLOWED,
  EXTENSIONS,
  MAX_BYTES,
  SIGNATURE_BYTES,
  matchesSignature,
} from "./imageFormats";

/**
 * Shared upload/cleanup handling for the private image buckets.
 *
 * The gallery and the blog both accept admin-uploaded images, and the checks
 * that matter — size, declared type, and the actual magic bytes — must not be
 * allowed to drift apart between them, so they live here once (in
 * ./imageFormats, which the browser shares too).
 *
 * Two upload shapes live here:
 *
 *  - handleImageUpload() takes the file as multipart and writes it to the
 *    bucket itself. Simple, but the whole file has to cross this function,
 *    and a Vercel function's request body is capped at 4.5 MB — anything
 *    bigger is rejected with a 413 by the platform before the handler runs.
 *    Still used by the blog, whose covers are small.
 *
 *  - handleSignedUploadUrl() + handleUploadVerify() hand the browser a
 *    short-lived signed URL and let it send the bytes straight to Supabase,
 *    so nothing large touches this function at all. That is what the gallery
 *    uses: a full-resolution artwork export is routinely past 4.5 MB.
 *
 * Callers are responsible for guardAdmin() before calling in; nothing in this
 * module authenticates.
 */

// Object names are generated here and nowhere else, so a path coming back
// from the browser must still look exactly like one we minted.
const OBJECT_PATH = /^[0-9a-f-]{36}\.(png|jpg|webp|avif)$/;

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
 * Mints a short-lived signed upload URL so the browser can PUT the file
 * straight to Supabase Storage, skipping this function entirely.
 *
 * Takes `{ contentType, size }` rather than the file, and answers with the
 * `{ bucket, path, token }` the browser needs plus the `image` reference to
 * save on the row once the upload lands.
 *
 * The path is chosen here, never by the caller: a random UUID, so there is no
 * traversal, no collision and nothing guessable from outside — the same
 * property the multipart handler above relies on. `contentType` and `size` are
 * only what the client *claims*; Supabase re-checks both against the bucket's
 * own allowed_mime_types and file_size_limit when the bytes actually arrive
 * (see supabase/schema.sql), so a lie here buys nothing.
 */
export async function handleSignedUploadUrl(
  request: Request,
  bucket: string,
): Promise<Response> {
  const supabase = getServiceClient();
  if (!supabase) return noClient();

  let body: { contentType?: unknown; size?: unknown };
  try {
    body = (await request.json()) as { contentType?: unknown; size?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json(
      { error: "Use a PNG, JPEG, WebP or AVIF image." },
      { status: 415 },
    );
  }

  const size = typeof body.size === "number" ? body.size : NaN;
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is larger than 25 MB." },
      { status: 413 },
    );
  }

  const path = `${crypto.randomUUID()}.${EXTENSIONS[contentType] ?? "png"}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error(`signed upload url for ${bucket}:`, error);
    return NextResponse.json(
      { error: "Could not start the upload." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { bucket, path, token: data.token, image: `${STORAGE_PREFIX}${path}` },
    { status: 201 },
  );
}

/**
 * Re-checks an object the browser uploaded directly, and deletes it if it
 * isn't the format it was signed for.
 *
 * The multipart path gets to inspect the magic bytes on the way past; a direct
 * upload doesn't, so this reads them back afterwards instead. It range-reads
 * only the first few bytes rather than downloading the object, which keeps the
 * check roughly free even for a 25 MB artwork.
 */
export async function handleUploadVerify(
  request: Request,
  bucket: string,
): Promise<Response> {
  const supabase = getServiceClient();
  const rest = getStorageRest();
  if (!supabase || !rest) return noClient();

  let body: { image?: unknown; contentType?: unknown };
  try {
    body = (await request.json()) as { image?: unknown; contentType?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image.trim() : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  if (!isStoredImage(image)) {
    return NextResponse.json({ error: "Not a stored image" }, { status: 400 });
  }

  const path = storagePath(image);
  // Only ever look at a name this module could itself have generated, so the
  // caller can't aim this read at some other object in the bucket.
  if (!OBJECT_PATH.test(path)) {
    return NextResponse.json({ error: "Not a stored image" }, { status: 400 });
  }

  const response = await fetch(`${rest.url}/object/${bucket}/${path}`, {
    headers: {
      apikey: rest.key,
      authorization: `Bearer ${rest.key}`,
      range: `bytes=0-${SIGNATURE_BYTES - 1}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "That upload didn't finish. Try again." },
      { status: 404 },
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!matchesSignature(bytes, contentType)) {
    await supabase.storage.from(bucket).remove([path]);
    return NextResponse.json(
      { error: "That file doesn't look like a valid image." },
      { status: 415 },
    );
  }

  return NextResponse.json({ ok: true });
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
 *
 * The body is piped straight through rather than buffered. supabase-js's
 * download() resolves a Blob, which means holding the whole object in the
 * function's memory and sending nothing until the last byte has arrived — on
 * a 20 MB artwork that is the slowest step in the whole pipeline, and it is
 * paid again for every image-optimizer cache miss. Forwarding the upstream
 * stream lets bytes start moving immediately and keeps memory flat whatever
 * the file size.
 */
export async function serveBucketImage(
  path: string[],
  bucket: string,
): Promise<Response> {
  const rest = getStorageRest();
  if (!rest) return noClient();

  const objectPath = path.join("/");

  // Reject traversal attempts outright rather than trusting the bucket API.
  if (objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const upstream = await fetch(`${rest.url}/object/${bucket}/${objectPath}`, {
    headers: { apikey: rest.key, authorization: `Bearer ${rest.key}` },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") || "image/png",
    // Object names are UUIDs, so a stored image is immutable once written.
    // The optimizer reads this too: its cache entry lives for the larger of
    // this max-age and images.minimumCacheTTL, so a year here means an
    // artwork is pulled out of the bucket once, not on a 4-hour cycle.
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": "inline",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new NextResponse(upstream.body, { headers });
}
