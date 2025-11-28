import { notFound } from "next/navigation";
import { getServiceSupabaseClient } from "@/lib/db";
import { CleanerPortalClient } from "./CleanerPortalClient";
import type {
  ScheduleClean,
  ScheduleProperty,
  ScheduleRange,
} from "@/app/schedule/types";

type CleanerLinkRecord = {
  token: string;
  cleaner: {
    id: string;
    user_id: string;
    name: string;
    cleaner_type: "individual" | "company";
    phone?: string | null;
    notes?: string | null;
    payment_details?: string | null;
  } | null;
};

export default async function CleanerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabaseClient();

  const { data: linkData } = await supabase
    .from("cleaner_links")
    .select(
      `
        token,
        cleaner:cleaners (
          id,
          user_id,
          name,
          cleaner_type,
          phone,
          notes,
          payment_details
        )
      `
    )
    .eq("token", token)
    .maybeSingle<CleanerLinkRecord>();

  if (!linkData || !linkData.cleaner) {
    notFound();
  }

  const cleaner = linkData.cleaner;

  const { data: propertiesData } = await supabase
    .from("properties")
    .select(
      "id, name, cleaner, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", cleaner.user_id)
    .ilike("cleaner", cleaner.name);

  // For each property, get its cleaning checklists
  const propertiesWithChecklists = await Promise.all(
    (propertiesData ?? []).map(async (property) => {
      const { data: checklists } = await supabase
        .from("cleaning_checklists")
        .select("*")
        .eq("property_id", property.id)
        .order("sort_order", { ascending: true });
      
      return {
        ...property,
        cleaning_checklists: checklists || [],
      };
    })
  );

  const scheduleProperties: ScheduleProperty[] = (propertiesWithChecklists ?? []).map(
    (property) => ({
      id: property.id,
      name: property.name,
      checkout_time: property.checkout_time ?? "10:00",
      cleaner: property.cleaner ?? null,
      access_codes: property.access_codes ?? null,
      bin_locations: property.bin_locations ?? null,
      property_address: property.property_address ?? null,
      key_locations: property.key_locations ?? null,
      cleaning_checklists: property.cleaning_checklists || [],
    })
  );

  const propertyIds = scheduleProperties.map((property) => property.id);
  const propertyNameLookup = new Map(
    scheduleProperties.map((property) => [property.id, property.name])
  );
  const propertyCleanerLookup = new Map(
    scheduleProperties.map((property) => [property.id, property.cleaner])
  );

  const timelineStart = new Date();
  timelineStart.setHours(0, 0, 0, 0);
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setDate(timelineEnd.getDate() + 6);
  timelineEnd.setHours(23, 59, 59, 999);
  const fromIso = timelineStart.toISOString();
  const toIso = timelineEnd.toISOString();

  const { data: cleansData } = propertyIds.length
    ? await supabase
        .from("cleans")
        .select(
          `
            id,
            booking_uid,
            property_id,
            scheduled_for,
            status,
            notes,
            checklist_completions ( id, checklist_item_id, completed, completed_at, created_at, updated_at )
          `
        )
        .in("property_id", propertyIds)
        .gte("scheduled_for", fromIso)
        .lte("scheduled_for", toIso)
        .neq("status", "deleted")
        .neq("status", "cancelled")
        .order("scheduled_for", { ascending: true })
    : { data: [] };

  // Fetch bookings separately since we no longer have a foreign key relationship
  const cleansWithBookings = (cleansData ?? []).filter(
    (c: any) => c.booking_uid
  );
  const bookingMap = new Map<
    string,
    { checkin: string | null; checkout: string | null }
  >();

  if (cleansWithBookings.length > 0 && propertyIds.length > 0) {
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

  const initialCleans: ScheduleClean[] = (cleansData ?? []).map(
    (clean: any) => {
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
        checklist_completions: clean.checklist_completions ?? [],
      };
    }
  );

  const initialRange: ScheduleRange = { from: fromIso, to: toIso };

  return (
    <CleanerPortalClient
      token={token}
      cleaner={{
        name: cleaner.name,
        cleaner_type: cleaner.cleaner_type,
        phone: cleaner.phone ?? null,
        notes: cleaner.notes ?? null,
        payment_details: cleaner.payment_details ?? null,
      }}
      properties={scheduleProperties}
      initialCleans={initialCleans}
      initialRange={initialRange}
    />
  );
}
