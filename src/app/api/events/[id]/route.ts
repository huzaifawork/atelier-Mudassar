import { NextResponse } from "next/server";
import {
  getServiceClient,
  EVENT_BUCKET,
  type EventRow,
} from "../../../lib/supabase";
import {
  eventDraftToRow,
  rowToEvent,
  storedObjectsOf,
} from "../../../lib/eventsMap";
import type { EventDraft } from "../../../data/events";
import { guardAdmin } from "../../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

/** One event, drafts included — the edit screen loads through here. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { id } = await params;
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("GET /api/events/[id]:", error);
    return NextResponse.json({ error: "Could not load the event." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ item: rowToEvent(data as EventRow) });
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

  let body: Partial<EventDraft>;
  try {
    body = (await request.json()) as Partial<EventDraft>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("PATCH /api/events/[id] (read):", readError);
    return NextResponse.json({ error: "Could not load the event." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const current = rowToEvent(existing as EventRow);
  const merged: EventDraft = { ...current, ...body };

  const { data, error } = await supabase
    .from("events")
    .update(eventDraftToRow(merged))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (!conflict) console.error("PATCH /api/events/[id]:", error);
    return NextResponse.json(
      {
        error: conflict
          ? "That slug is already used by another event."
          : "Could not save the event.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  // Pictures dropped from the gallery are now unreferenced. Compared by
  // stored path rather than by position, because reordering the gallery
  // changes every index without removing anything.
  const kept = new Set(storedObjectsOf(merged.images));
  const orphans = storedObjectsOf(current.images).filter((path) => !kept.has(path));
  if (orphans.length > 0) {
    await supabase.storage.from(EVENT_BUCKET).remove(orphans);
  }

  return NextResponse.json({ item: rowToEvent(data as EventRow) });
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

  const { data: existing } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/events/[id]:", error);
    return NextResponse.json({ error: "Could not delete the event." }, { status: 500 });
  }

  // The event is gone, so every picture it owned is now an orphan.
  if (existing) {
    const orphans = storedObjectsOf(rowToEvent(existing as EventRow).images);
    if (orphans.length > 0) {
      await supabase.storage.from(EVENT_BUCKET).remove(orphans);
    }
  }

  return NextResponse.json({ ok: true });
}
