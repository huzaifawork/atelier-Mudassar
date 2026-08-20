import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServiceClient, type ContactMessageRow } from "../../../../lib/supabase";
import { guardAdmin } from "../../../../lib/adminGuard";
import { escapeHtml } from "../../../../lib/escapeHtml";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const replyText = body.message?.trim() ?? "";
  if (!replyText) {
    return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  }
  if (replyText.length > 5000) {
    return NextResponse.json({ error: "Reply is too long." }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("POST /api/messages/[id]/reply (read):", readError);
    return NextResponse.json({ error: "Could not load the message." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const original = existing as ContactMessageRow;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email sending is not configured." },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: "Atelier Mudassar <onboarding@resend.dev>",
    to: original.email,
    replyTo: process.env.CONTACT_TO_EMAIL,
    subject: "Re: Your message to Atelier Mudassar",
    text: `${replyText}\n\n— Mudassar Ghaffar, Atelier Mudassar\n\nOn ${formatDate(original.created_at)}, you wrote:\n${original.message}`,
    html: `
      <div style="font-family: Georgia, serif; color: #24211c; max-width: 560px;">
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(replyText)}</p>
        <p style="margin-top: 24px; color: #8a8072; font-size: 13px;">— Mudassar Ghaffar, Atelier Mudassar</p>
        <div style="margin-top: 24px; padding-left: 12px; border-left: 3px solid #cda35f; color: #6b6355; font-size: 13px;">
          <p style="margin: 0 0 4px;">On ${formatDate(original.created_at)}, you wrote:</p>
          <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(original.message)}</p>
        </div>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json(
      { error: "Failed to send the reply. Please try again." },
      { status: 502 },
    );
  }

  const repliedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ replied_at: repliedAt, reply_body: replyText, read: true })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    // The email already sent; a failure to record it locally shouldn't read
    // as a failed reply.
    console.error("POST /api/messages/[id]/reply (record):", error);
    return NextResponse.json({
      message: {
        id: original.id,
        name: original.name,
        email: original.email,
        message: original.message,
        read: true,
        repliedAt,
        replyBody: replyText,
        createdAt: original.created_at,
      },
    });
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
      replyBody: row.reply_body,
      createdAt: row.created_at,
    },
  });
}
