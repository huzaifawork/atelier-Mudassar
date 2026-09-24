"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import EventForm from "../../EventForm";
import type { Event } from "../../../../data/events";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { item?: Event }) => {
        if (!cancelled && data.item) setEvent(data.item);
      })
      .catch(() => {
        // Falls through to the "not found" panel below.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Events
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">
          {event ? `Edit “${event.title}”` : "Edit event"}
        </h1>
      </div>

      {!loaded ? (
        <p className="text-sm text-cream-dim/60">Loading…</p>
      ) : event ? (
        <EventForm key={event.id} existing={event} />
      ) : (
        <div className="border border-gold/20 bg-espresso/50 px-6 py-12 text-center">
          <p className="font-display text-xl text-porcelain">Event not found</p>
          <p className="text-sm text-cream-dim/60 mt-2">It may have been deleted.</p>
          <Link
            href="/admin/events"
            className="inline-block mt-6 px-5 py-2.5 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors"
          >
            Back to events
          </Link>
        </div>
      )}
    </>
  );
}
