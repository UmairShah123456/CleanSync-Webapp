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
    .select("id, name, cleaner, checkout_time")
    .eq("user_id", cleaner.user_id)
    .ilike("cleaner", cleaner.name);

  const scheduleProperties: ScheduleProperty[] = (propertiesData ?? []).map(
    (property) => ({
      id: property.id,
      name: property.name,
      checkout_time: property.checkout_time ?? "10:00",
      cleaner: property.cleaner ?? null,
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
            bookings(checkin, checkout)
          `
        )
        .in("property_id", propertyIds)
        .gte("scheduled_for", fromIso)
        .lte("scheduled_for", toIso)
        .neq("status", "deleted")
        .order("scheduled_for", { ascending: true })
    : { data: [] };

  const initialCleans: ScheduleClean[] = (cleansData ?? []).map((clean: any) => ({
    id: clean.id,
    booking_uid: clean.booking_uid,
    property_id: clean.property_id,
    property_name:
      propertyNameLookup.get(clean.property_id) ?? "Unknown property",
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes,
    checkin: clean.bookings?.checkin ?? null,
    checkout: clean.bookings?.checkout ?? null,
    cleaner: propertyCleanerLookup.get(clean.property_id) ?? null,
  }));

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
