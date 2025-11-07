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
    .select(
      "id, name, checkout_time, cleaner, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const properties = propertiesData ?? [];

  let cleans: any[] = [];

  if (properties.length) {
    const propertyIds = properties.map((property) => property.id);
    const { data } = await supabase
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
      .order("scheduled_for", { ascending: true });

    // Extra safeguard: filter out any cleans that don't have valid properties
    const validPropertyIds = new Set(propertyIds);
    cleans = (data ?? []).filter(
      (clean: any) =>
        clean.property_id && validPropertyIds.has(clean.property_id)
    );
  }

  const propertyLookup = new Map(
    properties.map((property) => [property.id, property.name])
  );
  const propertyCleanerLookup = new Map(
    properties.map((property) => [property.id, property.cleaner])
  );

  // Fetch related booking check-in/out times for these cleans
  // Now we need to match by both uid and property_id since the same uid can exist for multiple properties
  let bookingMap = new Map<
    string,
    { checkin: string | null; checkout: string | null }
  >();
  if (cleans.length) {
    const propertyIds = Array.from(
      new Set(cleans.map((c: any) => c.property_id))
    );
    const { data: bookings } = await supabase
      .from("bookings")
      .select("uid, property_id, checkin, checkout")
      .in("property_id", propertyIds);
    bookings?.forEach((b: any) => {
      // Use composite key (uid, property_id) to uniquely identify bookings
      const key = `${b.uid}:${b.property_id}`;
      bookingMap.set(key, { checkin: b.checkin, checkout: b.checkout });
    });
  }

  const initialCleans = cleans.map((clean: any) => {
    // Use composite key to match booking with correct property
    const bookingKey = clean.booking_uid
      ? `${clean.booking_uid}:${clean.property_id}`
      : null;
    const booking = bookingKey ? bookingMap.get(bookingKey) : null;

    return {
      id: clean.id,
      booking_uid: clean.booking_uid,
      property_id: clean.property_id,
      property_name:
        propertyLookup.get(clean.property_id) ?? "Unknown property",
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

  return (
    <DashboardClient
      email={user.email}
      properties={properties.map((property) => ({
        id: property.id,
        name: property.name,
        checkout_time: property.checkout_time || "10:00",
        cleaner: property.cleaner ?? null,
        access_codes: property.access_codes ?? null,
        bin_locations: property.bin_locations ?? null,
        property_address: property.property_address ?? null,
        key_locations: property.key_locations ?? null,
      }))}
      initialCleans={initialCleans}
    />
  );
}
