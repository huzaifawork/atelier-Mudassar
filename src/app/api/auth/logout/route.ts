import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/authServer";

export const dynamic = "force-dynamic";

// POST-only: a GET logout could be triggered by a stray <img> tag on any site.
export async function POST() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
