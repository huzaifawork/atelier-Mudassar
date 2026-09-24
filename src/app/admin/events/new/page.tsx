import Link from "next/link";
import EventForm from "../EventForm";

export default function NewEventPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Events
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">Add an event</h1>
      </div>
      <EventForm />
    </>
  );
}
