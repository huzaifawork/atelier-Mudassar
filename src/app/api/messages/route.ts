import { NextResponse } from "next/server";
import { getServiceClient, type ContactMessageRow } from "../../lib/supabase";
import { guardAdmin } from "../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

function rowToMessage(row: ContactMessageRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    read: row.read,
    repliedAt: row.replied_at,
    replyBody: row.reply_body,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/messages:", error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data as ContactMessageRow[]).map(rowToMessage),
  });
}
