import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { ScheduleClient } from "./ScheduleClient";
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
    .select("id, name, checkout_time, cleaner")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const properties: ScheduleProperty[] = (propertiesData ?? []).map(
    (property) => ({
      id: property.id,
      name: property.name,
      checkout_time: property.checkout_time ?? "10:00",
      cleaner: property.cleaner ?? null,
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
          bookings(checkin, checkout)
        `
      )
      .in("property_id", propertyIds)
      .gte("scheduled_for", fromIso)
      .lte("scheduled_for", toIso)
      .neq("status", "deleted")
      .order("scheduled_for", { ascending: true });

    const now = new Date();
    const cleansToComplete = (cleansData ?? []).filter((clean: any) => {
      if (clean.status !== "scheduled") {
        return false;
      }
      const scheduledDate = new Date(clean.scheduled_for);
      return scheduledDate < now;
    });

    if (cleansToComplete.length > 0) {
      const cleanIdsToComplete = cleansToComplete.map((clean: any) => clean.id);
      const { error: updateError } = await supabase
        .from("cleans")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .in("id", cleanIdsToComplete)
        .eq("status", "scheduled");

      if (!updateError) {
        cleansData?.forEach((clean: any) => {
          if (cleanIdsToComplete.includes(clean.id)) {
            clean.status = "completed";
          }
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
      .map((clean: any) => ({
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
  }

  return (
    <ScheduleClient
      email={user.email}
      properties={properties}
      initialCleans={cleans}
      initialRange={{ from: fromIso, to: toIso }}
    />
  );
}
