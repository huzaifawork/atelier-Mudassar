"use client";

import {
  assertUploadableImage,
  createDisplayImage,
  readImageSize,
} from "./imageFormats";

/**
 * Browser-side image upload, shared by the gallery and by events.
 *
 * Both buckets take the same three-stage route — sign, send, verify — so the
 * only thing that differs between them is which endpoint mints the signature.
 * Keeping one implementation means the awkward parts (the derivative, the
 * cleanup on a half-finished upload) can't drift apart between the two.
 */

export interface UploadedImage {
  /** The untouched original. */
  image: string;
  /** Web-sized copy actually served, when one could be made. */
  displayImage?: string;
  /** Real pixel size of the original. */
  width?: number;
  height?: number;
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Puts one blob in a bucket and returns its "storage:<path>" reference.
 *
 * The bytes go straight from this browser to Supabase Storage, never through
 * `endpoint`. That route runs as a Vercel function, and a Vercel function's
 * request body is capped at 4.5 MB — the platform answers anything larger
 * with a bare 413 before the handler runs. So the route only signs the upload
 * and checks it afterwards; the transfer itself bypasses it entirely.
 */
async function putInBucket(
  body: Blob,
  contentType: string,
  endpoint: string,
): Promise<string> {
  const signed = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: body.size }),
  });
  if (!signed.ok) {
    throw new Error(await readError(signed, "Upload failed"));
  }
  const { bucket, path, token, image } = (await signed.json()) as {
    bucket: string;
    path: string;
    token: string;
    image: string;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Uploads are not configured.");
  }

  // Imported on demand: this module reaches the public bundle through the
  // gallery store, and only an admin picking a file ever needs the client.
  const { createClient } = await import("@supabase/supabase-js");
  const storage = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  }).storage.from(bucket);

  const { error } = await storage.uploadToSignedUrl(path, token, body, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error("Could not upload the image. Check your connection and try again.");
  }

  // The server never saw these bytes, so let it read the first few back and
  // confirm the file is what it said it was. A failure here has already
  // removed the object server-side; the extra cleanup covers the other cases.
  const verified = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, contentType }),
  });
  if (!verified.ok) {
    void deleteUnusedImage(image, endpoint);
    throw new Error(await readError(verified, "Upload failed"));
  }

  return image;
}

/**
 * Uploads one picture: the original, plus the web-sized copy visitors get.
 *
 * Both are stored. `image` is the untouched file and stays the record;
 * `displayImage` is what gets rendered. Without the second one the image
 * optimizer has to pull a full-resolution file through a function every time
 * it needs a size it hasn't cached.
 *
 * The derivative is best-effort: if the browser can't decode the file, or the
 * re-encode gains nothing, it is omitted and the original is served — slower
 * for that one picture, never broken.
 */
export async function uploadImage(
  file: File,
  endpoint: string,
): Promise<UploadedImage> {
  // Cheap local checks first, so an unusable file is rejected with a specific
  // reason before a single byte goes over the wire.
  await assertUploadableImage(file);

  const size = await readImageSize(file);
  const image = await putInBucket(file, file.type, endpoint);

  let displayImage: string | undefined;
  try {
    const display = await createDisplayImage(file);
    if (display) displayImage = await putInBucket(display, "image/webp", endpoint);
  } catch {
    displayImage = undefined;
  }

  return {
    image,
    displayImage,
    width: size?.width,
    height: size?.height,
  };
}

/** Best-effort cleanup for an upload that was never attached to a saved row. */
export async function deleteUnusedImage(
  image: string,
  endpoint: string,
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
  } catch {
    // Best-effort — a failed cleanup just leaves one orphaned object, which
    // is the exact status quo this exists to reduce, not a new failure mode.
  }
}
