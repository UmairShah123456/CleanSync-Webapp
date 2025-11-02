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
    .select("id, name")
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
        bookings(checkin, checkout, status)
      `
    )
    .in("property_id", propertyIds)
    .order("scheduled_for", { ascending: true });

  const propertyId = searchParams.get("property_id");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (status) {
    query = query.eq("status", status);
  } else {
    // Exclude deleted cleans by default unless explicitly requested
    query = query.neq("status", "deleted");
  }

  if (from) {
    query = query.gte("scheduled_for", from);
  }

  if (to) {
    query = query.lte("scheduled_for", to);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = (data ?? []).map((clean: any) => ({
    id: clean.id,
    booking_uid: clean.booking_uid,
    property_id: clean.property_id,
    property_name: propertyLookup.get(clean.property_id) ?? "Unknown property",
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes,
    checkin: clean.bookings?.checkin ?? null,
    checkout: clean.bookings?.checkout ?? null,
  }));

  return NextResponse.json(response);
}
