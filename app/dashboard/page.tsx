import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
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
    .order("created_at", { ascending: false });

  const properties = propertiesData ?? [];

  let cleans: any[] = [];

  if (properties.length) {
    const propertyIds = properties.map((property) => property.id);
    const { data } = await supabase
      .from("cleans")
      .select("id, booking_uid, property_id, scheduled_for, status, notes")
      .in("property_id", propertyIds)
      .order("scheduled_for", { ascending: true });

    // Extra safeguard: filter out any cleans that don't have valid properties
    const validPropertyIds = new Set(propertyIds);
    cleans = (data ?? []).filter(
      (clean: any) =>
        clean.property_id && validPropertyIds.has(clean.property_id)
    );

    // Automatically mark cleans as completed if their scheduled date has passed
    if (cleans.length > 0) {
      const now = new Date();
      const cleansToComplete = cleans.filter((clean: any) => {
        if (clean.status !== "scheduled") {
          return false;
        }
        const scheduledDate = new Date(clean.scheduled_for);
        return scheduledDate < now;
      });

      if (cleansToComplete.length > 0) {
        const cleanIdsToComplete = cleansToComplete.map(
          (clean: any) => clean.id
        );

        // Batch update all cleans that should be completed
        const { error: updateError } = await supabase
          .from("cleans")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .in("id", cleanIdsToComplete)
          .eq("status", "scheduled"); // Only update if still scheduled (safety check)

        if (updateError) {
          console.error("Error auto-completing cleans:", updateError);
          // Don't fail the request, just log the error
        } else {
          // Update the local cleans array with the new statuses
          cleans.forEach((clean: any) => {
            if (cleanIdsToComplete.includes(clean.id)) {
              clean.status = "completed";
            }
          });
        }
      }
    }
  }

  const propertyLookup = new Map(
    properties.map((property) => [property.id, property.name])
  );
  const propertyCleanerLookup = new Map(
    properties.map((property) => [property.id, property.cleaner])
  );

  // Fetch related booking check-in/out times for these cleans
  let bookingMap = new Map<
    string,
    { checkin: string | null; checkout: string | null }
  >();
  if (cleans.length) {
    const bookingUids = cleans.map((c: any) => c.booking_uid);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("uid, checkin, checkout")
      .in("uid", bookingUids);
    bookings?.forEach((b: any) =>
      bookingMap.set(b.uid, { checkin: b.checkin, checkout: b.checkout })
    );
  }

  const initialCleans = cleans.map((clean: any) => ({
    id: clean.id,
    booking_uid: clean.booking_uid,
    property_id: clean.property_id,
    property_name: propertyLookup.get(clean.property_id) ?? "Unknown property",
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes,
    checkin: bookingMap.get(clean.booking_uid)?.checkin ?? null,
    checkout: bookingMap.get(clean.booking_uid)?.checkout ?? null,
    cleaner: propertyCleanerLookup.get(clean.property_id) ?? null,
  }));

  return (
    <DashboardClient
      email={user.email}
      properties={properties.map((property) => ({
        id: property.id,
        name: property.name,
        checkout_time: property.checkout_time || "10:00",
      }))}
      initialCleans={initialCleans}
    />
  );
}
