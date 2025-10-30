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
    .select("id, name")
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

    cleans = data ?? [];
  }

  const propertyLookup = new Map(
    properties.map((property) => [property.id, property.name])
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

  const initialCleans = cleans.map((clean) => ({
    id: clean.id,
    booking_uid: clean.booking_uid,
    property_id: clean.property_id,
    property_name: propertyLookup.get(clean.property_id) ?? "Unknown property",
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes,
    checkin: bookingMap.get(clean.booking_uid)?.checkin ?? null,
    checkout: bookingMap.get(clean.booking_uid)?.checkout ?? null,
  }));

  return (
    <DashboardClient
      email={user.email}
      properties={properties.map((property) => ({
        id: property.id,
        name: property.name,
      }))}
      initialCleans={initialCleans}
    />
  );
}
