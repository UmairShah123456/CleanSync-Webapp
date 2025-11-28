import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select(
      "id, name, cleaner, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", user.id);

  if (propertiesError) {
    return NextResponse.json(
      { error: propertiesError.message },
      { status: 500 }
    );
  }

  if (!properties || properties.length === 0) {
    return NextResponse.json([]);
  }

  const propertyIds = properties.map((property) => property.id);
  const propertyLookup = new Map(
    properties.map((property) => [property.id, property.name])
  );
  const propertyCleanerLookup = new Map(
    properties.map((property) => [property.id, property.cleaner])
  );

  let query = supabase
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

  const propertyId = searchParams.get("property_id");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cleaner = searchParams.get("cleaner");

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (status) {
    query = query.eq("status", status);
  } else {
    // Exclude deleted and cancelled cleans for schedule view
    query = query.neq("status", "deleted").neq("status", "cancelled");
  }

  if (from) {
    query = query.gte("scheduled_for", from);
  }

  if (to) {
    query = query.lte("scheduled_for", to);
  }

  // Filter by cleaner - get property IDs that have the matching cleaner
  if (cleaner) {
    const propertyIdsWithCleaner = properties
      .filter((p) => p.cleaner === cleaner)
      .map((p) => p.id);
    if (propertyIdsWithCleaner.length > 0) {
      query = query.in("property_id", propertyIdsWithCleaner);
    } else {
      // No properties match this cleaner, return empty result
      return NextResponse.json([]);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch bookings separately since we no longer have a foreign key relationship
  // We need to match by both uid and property_id
  const cleansWithBookings = data.filter((c: any) => c.booking_uid);
  const bookingMap = new Map<
    string,
    { checkin: string | null; checkout: string | null }
  >();

  if (cleansWithBookings.length > 0) {
    // Build a list of (uid, property_id) pairs to fetch
    const bookingKeys = new Set(
      cleansWithBookings.map((c: any) => `${c.booking_uid}:${c.property_id}`)
    );

    // Fetch all bookings for these properties
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("uid, property_id, checkin, checkout")
      .in("property_id", propertyIds);

    if (!bookingsError && bookings) {
      bookings.forEach((b: any) => {
        const key = `${b.uid}:${b.property_id}`;
        bookingMap.set(key, { checkin: b.checkin, checkout: b.checkout });
      });
    }
  }

  const response = (data ?? []).map((clean: any) => {
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

  return NextResponse.json(response);
}
