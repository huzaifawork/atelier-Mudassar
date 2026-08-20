"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../ConfirmDialog";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  repliedAt: string | null;
  replyBody: string | null;
  createdAt: string;
}

const action =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

const replyField =
  "w-full bg-ink/40 border border-gold/15 rounded-sm px-4 py-3 text-porcelain text-sm " +
  "placeholder:text-cream-dim/30 focus:outline-none focus:ring-1 focus:border-gold focus:ring-gold/40 " +
  "transition-colors resize-none";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ContactMessage | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data: { messages?: ContactMessage[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setMessages(data.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load messages.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(id: string, work: () => Promise<unknown>) {
    setBusy(id);
    setNotice(null);
    try {
      await work();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleRead(msg: ContactMessage) {
    const nextRead = !msg.read;
    const res = await fetch(`/api/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: nextRead }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to update message.");
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: nextRead } : m)));
  }

  async function remove(id: string) {
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to delete message.");
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function sendReply(msg: ContactMessage) {
    const res = await fetch(`/api/messages/${msg.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyDraft }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to send reply.");
    const sentReply = replyDraft;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              read: true,
              repliedAt: data.message?.repliedAt ?? new Date().toISOString(),
              replyBody: data.message?.replyBody ?? sentReply,
            }
          : m,
      ),
    );
    setReplyingId(null);
    setReplyDraft("");
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-porcelain">Messages</h1>
          <p className="text-sm text-cream-dim/60 mt-1">
            {loaded
              ? `${messages.length} ${messages.length === 1 ? "message" : "messages"}${
                  unreadCount ? ` · ${unreadCount} unread` : ""
                }`
              : "Loading…"}
          </p>
        </div>
      </div>

      {(error || notice) && (
        <p className="mb-6 border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
          {error ?? notice}
        </p>
      )}

      {loaded && messages.length === 0 && !error && (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">No messages yet</p>
          <p className="text-sm text-cream-dim/60 mt-2 max-w-md mx-auto">
            Messages sent through the site&apos;s contact form will appear here.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {messages.map((msg) => (
          <li
            key={msg.id}
            className={`border p-4 transition-colors ${
              msg.read ? "border-gold/15 bg-espresso/40" : "border-gold-bright/40 bg-espresso/60"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-lg text-porcelain truncate">{msg.name}</p>
                  {!msg.read && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.6rem] tracking-[0.2em] uppercase border border-gold-bright/50 text-gold-bright rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-bright animate-pulse" />
                      New
                    </span>
                  )}
                  {msg.repliedAt && (
                    <span
                      title={`Replied ${formatDate(msg.repliedAt)}`}
                      className="inline-flex items-center px-2.5 py-0.5 text-[0.6rem] tracking-[0.2em] uppercase border border-gold/30 text-gold/80 rounded-full"
                    >
                      Replied
                    </span>
                  )}
                </div>
                <a
                  href={`mailto:${msg.email}`}
                  className="text-copper text-xs tracking-[0.1em] hover:text-gold-bright transition-colors break-all"
                >
                  {msg.email}
                </a>
                <p className="text-cream-dim/60 text-[0.65rem] tracking-[0.15em] uppercase mt-1">
                  {formatDate(msg.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (replyingId === msg.id) {
                      setReplyingId(null);
                    } else {
                      setReplyingId(msg.id);
                      setReplyDraft("");
                    }
                  }}
                  className={`${action} border-gold/40 text-gold-bright hover:bg-gold hover:text-ink`}
                >
                  {replyingId === msg.id ? "Cancel reply" : "Reply"}
                </button>
                <button
                  onClick={() => run(msg.id, () => toggleRead(msg))}
                  disabled={busy === msg.id}
                  className={`${action} border-gold/20 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-50`}
                >
                  {msg.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  onClick={() => setConfirming(msg)}
                  className={`${action} border-copper/40 text-copper hover:bg-copper hover:text-ink`}
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm text-cream-dim/80 leading-relaxed whitespace-pre-wrap wrap-break-word border-t border-gold/10 pt-3">
              {msg.message}
            </p>

            {msg.replyBody && replyingId !== msg.id && (
              <div className="mt-3 pl-3 border-l-2 border-gold/40">
                <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold/70 mb-1">
                  Your reply
                </p>
                <p className="text-sm text-cream-dim/70 leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {msg.replyBody}
                </p>
              </div>
            )}

            {replyingId === msg.id && (
              <div className="mt-4 border-t border-gold/10 pt-4">
                <label
                  htmlFor={`reply-${msg.id}`}
                  className="block text-xs tracking-[0.2em] uppercase text-cream-dim/60 mb-2"
                >
                  Reply to {msg.name}
                </label>
                <textarea
                  id={`reply-${msg.id}`}
                  rows={4}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="Write your reply…"
                  className={replyField}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => run(msg.id, () => sendReply(msg))}
                    disabled={busy === msg.id || !replyDraft.trim()}
                    className={`${action} border-gold bg-gold text-ink hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {busy === msg.id ? "Sending…" : "Send reply"}
                  </button>
                  <p className="text-xs text-cream-dim/60">
                    Sends to {msg.email}
                  </p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {confirming && (
        <ConfirmDialog
          title="Delete this message?"
          description={`The message from ${confirming.name} will be permanently removed. This can't be undone.`}
          confirmLabel="Delete message"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const target = confirming;
            setConfirming(null);
            void run(target.id, () => remove(target.id));
          }}
        />
      )}
    </>
  );
}
