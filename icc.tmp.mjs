import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const s = createClient(url, key, { auth: { persistSession: false } });
const { data } = await s.from("artworks").select("title,image,display_image").order("sort_order");

for (const r of data.filter(r => r.image?.startsWith("storage:"))) {
  for (const [label, ref] of [["original", r.image], ["derivative", r.display_image]]) {
    if (!ref) { console.log(`${(r.title??"").padEnd(20)} ${label.padEnd(11)} (none)`); continue; }
    const p = ref.slice(8);
    const res = await fetch(`${url}/storage/v1/object/artworks/${p}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
    const buf = Buffer.from(await res.arrayBuffer());
    const m = await sharp(buf, { limitInputPixels: false }).metadata();
    const stats = await sharp(buf, { limitInputPixels: false }).stats();
    const mean = stats.channels.slice(0,3).map(c => c.mean.toFixed(1)).join("/");
    console.log(`${(r.title??"").padEnd(20)} ${label.padEnd(11)} space=${String(m.space).padEnd(5)} icc=${m.icc ? m.icc.length + "B" : "NONE"} depth=${m.depth} meanRGB=${mean}`);
  }
}
