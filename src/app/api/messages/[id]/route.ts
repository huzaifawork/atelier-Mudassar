import { NextResponse } from "next/server";
import { getServiceClient, type ContactMessageRow } from "../../../lib/supabase";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;

  let body: { read?: boolean };
  try {
    body = (await request.json()) as { read?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.read !== "boolean") {
    return NextResponse.json({ error: "read must be a boolean" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .update({ read: body.read })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/messages/[id]:", error);
    return NextResponse.json({ error: "Could not update the message." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const row = data as ContactMessageRow;
  return NextResponse.json({
    message: {
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      read: row.read,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;

  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/messages/[id]:", error);
    return NextResponse.json({ error: "Could not delete the message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
