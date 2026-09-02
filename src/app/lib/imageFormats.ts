/**
 * The image formats the admin uploader accepts, and the byte-level check that
 * a file really is what its Content-Type claims to be.
 *
 * Deliberately free of any server-only import: artwork now goes straight from
 * the browser to Supabase Storage (see uploadArtworkImage in galleryStore.tsx)
 * rather than through a route handler, so the browser has to run the same
 * checks the server does. Keeping one definition here is what stops the two
 * sides from drifting apart.
 */

export const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — comfortably above a large PNG export.

export const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

export const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Leading bytes matchesSignature() needs — also the length the server
 *  range-reads back out of the bucket to re-check an upload it never saw. */
export const SIGNATURE_BYTES = 12;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/** Verifies the leading bytes match the claimed image type. */
export function matchesSignature(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length < SIGNATURE_BYTES) return false;
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

/**
 * Browser-side gate, run before a byte leaves the machine.
 *
 * The same rules are enforced again server-side (size and MIME type by the
 * bucket itself, the signature by the verify step), so this isn't the security
 * boundary — it's here so the artist is told *which* rule they tripped, right
 * when they pick the file, instead of watching a save fail later on.
 *
 * Throws with a message meant to be shown as-is.
 */
export async function assertUploadableImage(file: File): Promise<void> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use a PNG, JPEG, WebP or AVIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than 25 MB.");
  }

  const head = new Uint8Array(await file.slice(0, SIGNATURE_BYTES).arrayBuffer());
  if (!matchesSignature(head, file.type)) {
    throw new Error("That file doesn't look like a valid image.");
  }
}

/** Longest edge of the web-sized derivative. Deliberately above the 1920px
 *  the lightbox asks for, so downsizing to it is never visible. */
export const DISPLAY_MAX_EDGE = 2560;
const DISPLAY_QUALITY = 0.9;
/** An original already at web scale and this small isn't worth re-encoding. */
const DISPLAY_SKIP_BYTES = 1_500_000;

/**
 * Builds the web-sized WebP that visitors are actually served.
 *
 * The originals here are full-resolution exports — 40 to 140 megapixels, up
 * to 22 MB. Serving those means the image optimizer pulls an entire export
 * through a function every time it needs a size it hasn't cached, just to
 * emit a 24 KB thumbnail. Encoding a ~2560px copy once, here in the browser
 * where the file already is, makes every later step cheap.
 *
 * The original is uploaded too and stays the artist's master; this only
 * changes what gets sent to a browser, and at 2560px that is larger than any
 * size the site requests.
 *
 * Returns null when there is nothing worth doing (already small) or when the
 * browser can't decode the file — a very large export can exhaust memory.
 * Callers fall back to serving the original: slower, never broken.
 */
export async function createDisplayImage(file: File): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function") return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, DISPLAY_MAX_EDGE / longest);
    if (scale === 1 && file.size <= DISPLAY_SKIP_BYTES) return null;

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", DISPLAY_QUALITY);
    });

    // Nothing gained if the re-encode came out no smaller than the original.
    if (!blob || blob.size >= file.size) return null;
    return blob;
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}

/**
 * The picked file's real pixel size, decoded in the browser.
 *
 * Recorded on the artwork so the gallery can reserve each card at the piece's
 * own shape before the image has loaded — otherwise a landscape or square
 * work sits letterboxed in a portrait box, or the grid reflows under the
 * visitor as images arrive.
 *
 * Returns null rather than throwing: a missing size costs a fallback, and is
 * never a reason to block an upload that has already passed its checks.
 */
export async function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  // createImageBitmap decodes off the main thread and needs no DOM node, but
  // isn't everywhere (older Safari, and it rejects some AVIF builds), so fall
  // back to an <img> against an object URL.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (width && height) return { width, height };
    } catch {
      // Fall through.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () =>
        resolve(
          image.naturalWidth && image.naturalHeight
            ? { width: image.naturalWidth, height: image.naturalHeight }
            : null,
        );
      image.onerror = () => resolve(null);
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
