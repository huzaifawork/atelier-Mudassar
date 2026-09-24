"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  coverOf,
  excerptForEvent,
  formatEventDate,
  type Event,
} from "../../data/events";
import { eventDisplaySrc } from "../../lib/eventsMap";
import ConfirmDialog from "../ConfirmDialog";

const action =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Event | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { items?: Event[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setEvents(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load events.");
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

  async function togglePublished(event: Event) {
    const published = !event.published;
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not update the event.");
    setEvents((current) =>
      current.map((item) => (item.id === event.id ? { ...item, published } : item)),
    );
  }

  async function remove(event: Event) {
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not delete the event.");
    setEvents((current) => current.filter((item) => item.id !== event.id));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-porcelain">Events</h1>
          <p className="text-sm text-cream-dim/70 mt-1.5">
            Exhibitions, features and press — shown alongside the Journal.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors"
        >
          Add event
        </Link>
      </div>

      {error && (
        <p className="mb-6 border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-6 border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper">
          {notice}
        </p>
      )}

      {!loaded ? (
        <p className="text-sm text-cream-dim/60">Loading…</p>
      ) : events.length === 0 ? (
        <div className="border border-gold/20 bg-espresso/40 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">No events yet</p>
          <p className="text-sm text-cream-dim/65 mt-2 max-w-md mx-auto">
            An event is a show, a feature or a mention — a few photographs and
            the links to where it was written up.
          </p>
          <Link
            href="/admin/events/new"
            className="inline-block mt-6 px-5 py-2.5 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            Add the first one
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const cover = coverOf(event);
            return (
              <li
                key={event.id}
                className="grid grid-cols-[76px_1fr] sm:grid-cols-[76px_1fr_auto] gap-4 items-start border border-gold/15 bg-espresso/40 p-3 hover:border-gold/30 transition-colors"
              >
                <div className="relative aspect-4/3 w-full bg-espresso overflow-hidden">
                  {cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={eventDisplaySrc(cover)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] tracking-[0.2em] uppercase text-cream-dim/40">
                      No photo
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg text-porcelain truncate">
                      {event.title}
                    </p>
                    {!event.published && (
                      <span className="shrink-0 text-[0.6rem] tracking-[0.2em] uppercase border border-copper/50 text-copper px-2 py-0.5">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-copper text-[0.68rem] tracking-[0.2em] uppercase mt-1">
                    {formatEventDate(event.eventDate)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  <p className="text-sm text-cream-dim/70 mt-2 line-clamp-2">
                    {excerptForEvent(event, 140)}
                  </p>
                  <p className="text-[0.68rem] text-cream-dim/50 mt-2">
                    {event.images.length} photo{event.images.length === 1 ? "" : "s"}
                    {event.links.length > 0 &&
                      ` · ${event.links.length} link${event.links.length === 1 ? "" : "s"}`}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-2 sm:justify-end">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className={`${action} border-gold/30 text-cream-dim hover:border-gold/60 hover:text-gold-bright`}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => void run(event.id, () => togglePublished(event))}
                    disabled={busy === event.id}
                    className={`${action} border-gold/30 text-cream-dim hover:border-gold/60 hover:text-gold-bright disabled:opacity-50`}
                  >
                    {event.published ? "Unpublish" : "Publish"}
                  </button>
                  {event.published && (
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      className={`${action} border-gold/30 text-cream-dim hover:border-gold/60 hover:text-gold-bright`}
                    >
                      View
                    </Link>
                  )}
                  <button
                    onClick={() => setConfirming(event)}
                    disabled={busy === event.id}
                    className={`${action} border-copper/40 text-copper hover:bg-copper hover:text-ink disabled:opacity-50`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete “${confirming.title}”?`}
          description="The event and its photographs are removed for good."
          confirmLabel="Delete"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const target = confirming;
            setConfirming(null);
            void run(target.id, () => remove(target));
          }}
        />
      )}
    </>
  );
}
