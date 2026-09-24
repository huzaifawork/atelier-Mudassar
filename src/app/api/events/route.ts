import { NextResponse } from "next/server";
import {
  getServiceClient,
  isMissingColumn,
  type EventRow,
} from "../../lib/supabase";
import { eventDraftToRow, rowToEvent } from "../../lib/eventsMap";
import type { EventDraft } from "../../data/events";
import { guardAdmin } from "../../lib/adminGuard";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 },
  );
}

function missingTable(error: { code?: string } | null): boolean {
  // 42P01 is undefined_table — schema.sql hasn't been re-run since deploying.
  return error?.code === "42P01" || isMissingColumn(error);
}

/** Every event, drafts included — admin only. The public list comes from
 *  lib/eventsServer.ts on the anon key, where RLS hides unpublished ones. */
export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    if (missingTable(error)) {
      return NextResponse.json(
        { error: "The events table is missing — re-run supabase/schema.sql." },
        { status: 500 },
      );
    }
    console.error("GET /api/events:", error);
    return NextResponse.json({ error: "Could not load events." }, { status: 500 });
  }

  return NextResponse.json({ items: (data as EventRow[]).map(rowToEvent) });
}

export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  if (!supabase) return noClient();

  let draft: EventDraft;
  try {
    draft = (await request.json()) as EventDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!draft?.title?.trim() || !draft?.slug?.trim()) {
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert(eventDraftToRow(draft))
    .select()
    .single();

  if (error) {
    const conflict = error.code === "23505";
    if (missingTable(error)) {
      return NextResponse.json(
        { error: "The events table is missing — re-run supabase/schema.sql." },
        { status: 500 },
      );
    }
    if (!conflict) console.error("POST /api/events:", error);
    return NextResponse.json(
      {
        error: conflict
          ? "That slug is already used by another event."
          : "Could not save the event.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ item: rowToEvent(data as EventRow) }, { status: 201 });
}
