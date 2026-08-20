import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServiceClient } from "../../lib/supabase";
import { escapeHtml } from "../../lib/escapeHtml";
import { clientIp, rateLimit, tooManyRequests } from "../../lib/rateLimit";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // The only public write endpoint in the app — sends real email and writes
  // to the database on every call, so it's the highest-value spam/cost
  // target on the site. Deliberately tight.
  const limited = rateLimit(`contact:${clientIp(request)}`, 3, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  let body: { name?: string; email?: string; message?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const honeypot = body.company?.trim() ?? "";

  // Silently accept spam-bot submissions (honeypot filled) without sending mail.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (name.length > 200 || email.length > 254 || message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  // Store first so the message survives even if email delivery fails — the
  // admin panel is then the fallback if Resend has an outage or isn't set up.
  const supabase = getServiceClient();
  let stored = false;
  if (supabase) {
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });
    stored = !dbError;
  }

  const to = process.env.CONTACT_TO_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  let emailed = false;
  if (apiKey && to) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Atelier Mudassar <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `New inquiry from ${name.replace(/[\r\n]+/g, " ")}`,
      text: `${message}\n\n— ${name} (${email})`,
      html: `
        <div style="font-family: Georgia, serif; color: #24211c; max-width: 560px;">
          <h2 style="color:#1a1410; margin-bottom: 4px;">New message from your portfolio</h2>
          <p style="color:#6b6355; margin-top:0; font-size: 13px;">via Atelier Mudassar contact form</p>
          <p style="margin: 16px 0 4px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 16px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="white-space: pre-wrap; border-left: 3px solid #cda35f; padding-left: 12px;">${escapeHtml(message)}</p>
        </div>
      `,
    });
    emailed = !error;
  }

  if (!stored && !emailed) {
    return NextResponse.json(
      { error: "Failed to send your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
