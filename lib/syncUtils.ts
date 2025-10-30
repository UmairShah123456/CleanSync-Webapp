import type { SupabaseClient } from "@supabase/supabase-js";
import { addHours, isSameDay } from "./utils";
import type { CalendarEvent } from "./ical";
import { fetchCalendarEvents } from "./ical";

export type PropertyRecord = {
  id: string;
  user_id: string;
  name: string;
  ical_url: string;
};

type BookingRecord = {
  uid: string;
  property_id: string;
  checkin: string | null;
  checkout: string | null;
  status: string;
};

const SAME_DAY_NOTE = "⚠️ Same-day check-in.";
const CANCELLATION_NOTE =
  "❌ This clean has been removed due to a cancellation.";

const scheduleFromCheckout = (checkout: Date): string => {
  return addHours(checkout, 1).toISOString();
};

const upsertBooking = async (
  supabase: SupabaseClient,
  propertyId: string,
  event: CalendarEvent
) => {
  const { error } = await supabase.from("bookings").upsert(
    {
      uid: event.uid,
      property_id: propertyId,
      checkin: event.start.toISOString(),
      checkout: event.end.toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "uid",
    }
  );

  if (error) {
    throw new Error(`Failed to upsert booking ${event.uid}: ${error.message}`);
  }
};

const ensureClean = async (
  supabase: SupabaseClient,
  propertyId: string,
  event: CalendarEvent,
  hasSameDayCheckIn: boolean
) => {
  const scheduledFor = scheduleFromCheckout(event.end);
  const notes = hasSameDayCheckIn ? SAME_DAY_NOTE : null;

  const { data, error } = await supabase
    .from("cleans")
    .select("id")
    .eq("booking_uid", event.uid)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read clean for booking ${event.uid}: ${error.message}`
    );
  }

  if (!data) {
    const { error: insertError } = await supabase.from("cleans").insert({
      booking_uid: event.uid,
      property_id: propertyId,
      scheduled_for: scheduledFor,
      notes,
      status: "scheduled",
    });

    if (insertError) {
      throw new Error(
        `Failed to insert clean for booking ${event.uid}: ${insertError.message}`
      );
    }
    return;
  }

  const { error: updateError } = await supabase
    .from("cleans")
    .update({
      scheduled_for: scheduledFor,
      notes,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    throw new Error(
      `Failed to update clean for booking ${event.uid}: ${updateError.message}`
    );
  }
};

const cancelBookingAndClean = async (supabase: SupabaseClient, uid: string) => {
  const timestamp = new Date().toISOString();

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: timestamp })
    .eq("uid", uid);

  if (bookingError) {
    throw new Error(`Failed to cancel booking ${uid}: ${bookingError.message}`);
  }

  const { error: cleanError } = await supabase
    .from("cleans")
    .update({
      status: "cancelled",
      notes: CANCELLATION_NOTE,
      updated_at: timestamp,
    })
    .eq("booking_uid", uid);

  if (cleanError) {
    throw new Error(
      `Failed to cancel clean for booking ${uid}: ${cleanError.message}`
    );
  }
};

const hasSameDayTurnover = (
  event: CalendarEvent,
  events: CalendarEvent[]
): boolean => {
  return events.some(
    (other) => other.uid !== event.uid && isSameDay(other.start, event.end)
  );
};

const bookingChanged = (existing: BookingRecord, event: CalendarEvent) => {
  if (!existing.checkin || !existing.checkout) return true;
  const checkinChanged =
    new Date(existing.checkin).getTime() !== event.start.getTime();
  const checkoutChanged =
    new Date(existing.checkout).getTime() !== event.end.getTime();
  return checkinChanged || checkoutChanged || existing.status !== "active";
};

export const syncPropertyCalendar = async (
  supabase: SupabaseClient,
  property: PropertyRecord
) => {
  const events = await fetchCalendarEvents(property.ical_url);

  const activeEvents = events.filter(
    (event) => event.status?.toUpperCase() !== "CANCELLED"
  );
  const cancelledEvents = events
    .filter((event) => event.status?.toUpperCase() === "CANCELLED")
    .map((event) => event.uid);

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", property.id);

  if (bookingsError) {
    throw new Error(
      `Failed to load bookings for property ${property.id}: ${bookingsError.message}`
    );
  }

  const bookingsMap = new Map<string, BookingRecord>();
  bookings?.forEach((booking) => bookingsMap.set(booking.uid, booking));

  let added = 0;
  let updated = 0;
  let removed = 0;

  for (const event of activeEvents) {
    const existing = bookingsMap.get(event.uid);
    const sameDay = hasSameDayTurnover(event, activeEvents);

    if (!existing) {
      await upsertBooking(supabase, property.id, event);
      await ensureClean(supabase, property.id, event, sameDay);
      added += 1;
      continue;
    }

    if (bookingChanged(existing, event)) {
      await upsertBooking(supabase, property.id, event);
      await ensureClean(supabase, property.id, event, sameDay);
      updated += 1;
    } else if (sameDay) {
      await ensureClean(supabase, property.id, event, sameDay);
    }
  }

  const activeUids = new Set(activeEvents.map((event) => event.uid));

  for (const uid of bookingsMap.keys()) {
    if (!activeUids.has(uid) || cancelledEvents.includes(uid)) {
      await cancelBookingAndClean(supabase, uid);
      removed += 1;
    }
  }

  const { error: logError } = await supabase.from("sync_logs").insert({
    property_id: property.id,
    bookings_added: added,
    bookings_removed: removed,
    bookings_updated: updated,
    run_at: new Date().toISOString(),
  });

  if (logError) {
    throw new Error(
      `Failed to write sync log for property ${property.id}: ${logError.message}`
    );
  }

  return {
    bookingsAdded: added,
    bookingsUpdated: updated,
    bookingsRemoved: removed,
  };
};
