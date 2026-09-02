/**
 * Builds the web-sized derivative for artwork uploaded before the admin form
 * started producing one.
 *
 * The originals are full-resolution exports — tens of megapixels — and every
 * image-optimizer cache miss pulls one in full to produce a thumbnail. This
 * writes a `<uuid>.display.webp` next to each original and points the row's
 * display_image at it; `image` keeps pointing at the untouched original.
 *
 *   node --env-file=.env.local scripts/backfill-display-images.mjs --dry-run
 *   node --env-file=.env.local scripts/backfill-display-images.mjs
 *
 * Safe to re-run: rows that already have a display_image are skipped unless
 * --force is passed.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const MAX_EDGE = 2560; // Longest side. Comfortably above the 1920 the lightbox asks for.
const QUALITY = 90;
const BUCKET = "artworks";
const STORAGE_PREFIX = "storage:";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

let { data: rows, error } = await supabase
  .from("artworks")
  .select("id,title,image,display_image")
  .order("sort_order");

// A dry run only measures, so it can still report before the column exists.
if (error?.code === "42703") {
  if (!dryRun) {
    console.error("The display_image column is missing — re-run supabase/schema.sql first.");
    process.exit(1);
  }
  console.log("(display_image column not created yet — measuring only)");
  ({ data: rows, error } = await supabase
    .from("artworks")
    .select("id,title,image")
    .order("sort_order"));
}
if (error) throw error;

const stored = rows.filter((r) => r.image?.startsWith(STORAGE_PREFIX));
console.log(
  `${stored.length} uploaded artworks (${rows.length - stored.length} bundled demo assets skipped)\n`,
);

let originalTotal = 0;
let derivativeTotal = 0;

for (const row of stored) {
  const path = row.image.slice(STORAGE_PREFIX.length);
  if (row.display_image && !force) {
    console.log(`${(row.title ?? "").padEnd(20)} already has a derivative — skipped`);
    continue;
  }

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.log(`${(row.title ?? "").padEnd(20)} FAILED to download (${res.status})`);
    continue;
  }
  const input = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(input, { limitInputPixels: false }).metadata();

  const output = await sharp(input, { limitInputPixels: false })
    .rotate() // Honour EXIF orientation before it is stripped.
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();
  const outMeta = await sharp(output).metadata();

  originalTotal += input.length;
  derivativeTotal += output.length;

  const shrink = (input.length / output.length).toFixed(0);
  console.log(
    `${(row.title ?? "").padEnd(20)} ${String(meta.width + "x" + meta.height).padEnd(12)} ` +
      `${(meta.width * meta.height / 1e6).toFixed(0).padStart(3)} MP  ` +
      `${(input.length / 1048576).toFixed(2).padStart(6)} MB  ->  ` +
      `${outMeta.width}x${outMeta.height} ${(output.length / 1024).toFixed(0).padStart(4)} KB  (${shrink}x smaller)`,
  );

  if (dryRun) continue;

  const displayPath = `${path.replace(/\.[^.]+$/, "")}.display.webp`;
  const up = await supabase.storage
    .from(BUCKET)
    .upload(displayPath, output, { contentType: "image/webp", upsert: true });
  if (up.error) {
    console.log(`  upload failed: ${up.error.message}`);
    continue;
  }
  const patch = await supabase
    .from("artworks")
    .update({ display_image: `${STORAGE_PREFIX}${displayPath}` })
    .eq("id", row.id);
  if (patch.error) console.log(`  row update failed: ${patch.error.message}`);
  else console.log(`  -> ${displayPath}`);
}

if (originalTotal) {
  console.log(
    `\ntotal: ${(originalTotal / 1048576).toFixed(1)} MB of originals -> ` +
      `${(derivativeTotal / 1048576).toFixed(2)} MB of derivatives ` +
      `(${(originalTotal / derivativeTotal).toFixed(0)}x smaller)`,
  );
}
if (dryRun) console.log("\n(dry run — nothing was written)");
