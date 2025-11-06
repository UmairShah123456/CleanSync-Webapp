import ical, { VEvent } from "npm:node-ical@0.22.1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type PropertyRecord = {
  id: string;
  name: string;
  ical_url: string;
  checkout_time?: string | null;
};

type BookingRecord = {
  uid: string;
  checkin: string | null;
  checkout: string | null;
  status: string;
};

type CalendarEvent = {
  uid: string;
  start: Date;
  end: Date;
  status?: string;
};

const SAME_DAY_NOTE = "⚠️ Same-day check-in detected.";
const CANCELLATION_NOTE =
  "❌ This clean has been removed due to a cancellation.";

const isSameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const addHours = (date: Date, hours: number) => {
  const copy = new Date(date.getTime());
  copy.setHours(copy.getHours() + hours);
  return copy;
};

const scheduleFromCheckout = (checkout: Date) =>
  addHours(checkout, 1).toISOString();

export const fetchCalendarEvents = async (
  url: string
): Promise<CalendarEvent[]> => {
  const result = await ical.async.fromURL(url);

  return Object.values(result)
    .filter((entry): entry is VEvent => entry.type === "VEVENT")
    .filter((event) => event.start && event.end && event.uid)
    .map((event) => ({
      uid: event.uid!,
      start: new Date(event.start!),
      end: new Date(event.end!),
      status: event.status ?? undefined,
    }));
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
    { onConflict: "uid" }
  );

  if (error) {
    throw new Error(`Failed to upsert booking ${event.uid}: ${error.message}`);
  }
};

const ensureClean = async (
  supabase: SupabaseClient,
  propertyId: string,
  event: CalendarEvent,
  sameDay: boolean,
  checkoutTime?: string | null
) => {
  // Use property's checkout time or default to 10:00 AM
  const defaultTime = checkoutTime || "10:00";
  const [hours, minutes] = defaultTime.split(":").map(Number);

  const checkoutDate = new Date(event.end);
  checkoutDate.setHours(hours || 10, minutes || 0, 0, 0);
  // Set scheduled_for to the checkout time (no 1 hour delay)
  const scheduledFor = checkoutDate.toISOString();
  const notes = sameDay ? SAME_DAY_NOTE : null;

  const { data, error } = await supabase
    .from("cleans")
    .select("id, status")
    .eq("booking_uid", event.uid)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch clean for booking ${event.uid}: ${error.message}`
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

  // If the clean was manually deleted by the user, don't recreate it
  if (data.status === "deleted") {
    return;
  }

  // Don't override manually set statuses (completed, cancelled) - only update scheduled ones
  const shouldUpdateStatus = data.status === "scheduled";

  const updateData: {
    scheduled_for: string;
    notes: string | null;
    status?: string;
    updated_at: string;
  } = {
    scheduled_for: scheduledFor,
    notes,
    updated_at: new Date().toISOString(),
  };

  // Only update status if it's currently scheduled
  if (shouldUpdateStatus) {
    updateData.status = "scheduled";
  }

  const { error: updateError } = await supabase
    .from("cleans")
    .update(updateData)
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

const hasSameDayTurnover = (event: CalendarEvent, events: CalendarEvent[]) => {
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

export const syncProperty = async (
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
    .select("uid, checkin, checkout, status")
    .eq("property_id", property.id);

  if (bookingsError) {
    throw new Error(
      `Failed to fetch bookings for property ${property.id}: ${bookingsError.message}`
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
      await ensureClean(
        supabase,
        property.id,
        event,
        sameDay,
        property.checkout_time
      );
      added += 1;
      continue;
    }

    if (bookingChanged(existing, event)) {
      await upsertBooking(supabase, property.id, event);
      await ensureClean(
        supabase,
        property.id,
        event,
        sameDay,
        property.checkout_time
      );
      updated += 1;
    } else if (sameDay) {
      await ensureClean(
        supabase,
        property.id,
        event,
        sameDay,
        property.checkout_time
      );
    }
  }

  const activeUids = new Set(activeEvents.map((event) => event.uid));

  // Fetch all cleans for this property to check their status and dates
  const { data: cleans, error: cleansError } = await supabase
    .from("cleans")
    .select("id, booking_uid, scheduled_for, status")
    .eq("property_id", property.id);

  if (cleansError) {
    throw new Error(
      `Failed to load cleans for property ${property.id}: ${cleansError.message}`
    );
  }

  const cleansMap = new Map<
    string,
    { id: string; scheduled_for: string; status: string }
  >();
  cleans?.forEach((clean) => {
    if (clean.booking_uid) {
      cleansMap.set(clean.booking_uid, {
        id: clean.id,
        scheduled_for: clean.scheduled_for,
        status: clean.status,
      });
    }
  });

  const now = new Date();

  for (const uid of bookingsMap.keys()) {
    const shouldCancel = !activeUids.has(uid) || cancelledEvents.includes(uid);
    if (!shouldCancel) {
      continue;
    }

    // Check if we should cancel this clean
    const clean = cleansMap.get(uid);
    if (clean) {
      const scheduledFor = new Date(clean.scheduled_for);
      const isPast = scheduledFor < now;
      const isProtectedStatus = ["completed", "cancelled", "deleted"].includes(
        clean.status
      );

      // Don't cancel if:
      // 1. The clean is in the past (calendar might not return past events)
      // 2. The clean has a protected status (manually set)
      if (isPast || isProtectedStatus) {
        continue;
      }
    }

    await cancelBookingAndClean(supabase, uid);
    removed += 1;
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
