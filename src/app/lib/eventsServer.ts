import "server-only";
import { getPublicClient, type EventRow } from "./supabase";
import { rowToEvent } from "./eventsMap";
import type { Event } from "../data/events";

/**
 * Public reads for the Journal & Events index and /events/<slug>.
 *
 * Uses the anon key, so Row Level Security is what actually keeps unpublished
 * events hidden — the `published` filters below are for clarity and index
 * use, not the security boundary. Failures degrade to nothing rather than a
 * broken page, matching lib/blogServer.ts.
 */
export async function fetchPublishedEvents(): Promise<Event[]> {
  const supabase = getPublicClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("event_date", { ascending: false });

    return data ? (data as EventRow[]).map(rowToEvent) : [];
  } catch {
    return [];
  }
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    return data ? rowToEvent(data as EventRow) : null;
  } catch {
    return null;
  }
}
