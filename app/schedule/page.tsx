import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { ScheduleClient } from "./ScheduleClient";
import { AppShell } from "@/components/layout/AppShell";
import type { ScheduleClean, ScheduleProperty } from "./types";

export const revalidate = 0;

export default async function SchedulePage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: propertiesData } = await supabase
    .from("properties")
    .select(
      "id, name, checkout_time, cleaner, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const properties: ScheduleProperty[] = (propertiesData ?? []).map(
    (property) => ({
      id: property.id,
      name: property.name,
      checkout_time: property.checkout_time ?? "10:00",
      cleaner: property.cleaner ?? null,
      access_codes: property.access_codes ?? null,
      bin_locations: property.bin_locations ?? null,
      property_address: property.property_address ?? null,
      key_locations: property.key_locations ?? null,
    })
  );

  const propertyNameLookup = new Map(
    properties.map((property) => [property.id, property.name])
  );
  const propertyCleanerLookup = new Map(
    properties.map((property) => [property.id, property.cleaner ?? null])
  );

  const timelineStart = new Date();
  timelineStart.setHours(0, 0, 0, 0);
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setDate(timelineEnd.getDate() + 6);
  timelineEnd.setHours(23, 59, 59, 999);
  const fromIso = timelineStart.toISOString();
  const toIso = timelineEnd.toISOString();

  let cleans: ScheduleClean[] = [];

  if (properties.length > 0) {
    const propertyIds = properties.map((property) => property.id);
    const { data: cleansData } = await supabase
      .from("cleans")
      .select(
        `
          id,
          booking_uid,
          property_id,
          scheduled_for,
          status,
          notes,
          maintenance_notes,
          clean_reimbursements ( id, amount, item, created_at )
        `
      )
      .in("property_id", propertyIds)
      .gte("scheduled_for", fromIso)
      .lte("scheduled_for", toIso)
      .neq("status", "deleted")
      .neq("status", "cancelled")
      .order("scheduled_for", { ascending: true });

    // Fetch bookings separately since we no longer have a foreign key relationship
    const cleansWithBookings = (cleansData ?? []).filter(
      (c: any) => c.booking_uid
    );
    const bookingMap = new Map<
      string,
      { checkin: string | null; checkout: string | null }
    >();

    if (cleansWithBookings.length > 0) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("uid, property_id, checkin, checkout")
        .in("property_id", propertyIds);

      if (bookings) {
        bookings.forEach((b: any) => {
          const key = `${b.uid}:${b.property_id}`;
          bookingMap.set(key, { checkin: b.checkin, checkout: b.checkout });
        });
      }
    }

    // Extra safeguard: filter out any cleans that don't have valid properties
    const validPropertyIds = new Set(propertyIds);
    cleans = (cleansData ?? [])
      .filter(
        (clean: any) =>
          clean.property_id && validPropertyIds.has(clean.property_id)
      )
      .map((clean: any) => {
        // Match booking by both uid and property_id
        const bookingKey = clean.booking_uid
          ? `${clean.booking_uid}:${clean.property_id}`
          : null;
        const booking = bookingKey ? bookingMap.get(bookingKey) : null;

        return {
          id: clean.id,
          booking_uid: clean.booking_uid,
          property_id: clean.property_id,
          property_name:
            propertyNameLookup.get(clean.property_id) ?? "Unknown property",
          scheduled_for: clean.scheduled_for,
          status: clean.status,
          notes: clean.notes,
          checkin: booking?.checkin ?? null,
          checkout: booking?.checkout ?? null,
          cleaner: propertyCleanerLookup.get(clean.property_id) ?? null,
          maintenance_notes: clean.maintenance_notes ?? [],
          reimbursements:
            (clean.clean_reimbursements ?? []).map((entry: any) => ({
              id: entry.id,
              amount: Number(entry.amount),
              item: entry.item,
              created_at: entry.created_at,
            })) ?? [],
        };
      });
  }

  return (
    <AppShell email={user.email}>
      <ScheduleClient
        properties={properties}
        initialCleans={cleans}
        initialRange={{ from: fromIso, to: toIso }}
      />
    </AppShell>
  );
}
