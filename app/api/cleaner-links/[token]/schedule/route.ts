import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import type { ScheduleClean } from "@/app/schedule/types";

type CleanerLinkScheduleRecord = {
  token: string;
  cleaner: {
    id: string;
    user_id: string;
    name: string;
  } | null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const propertyId = request.nextUrl.searchParams.get("property_id");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing date range." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabaseClient();

  const { data: linkData, error: linkError } = await supabase
    .from("cleaner_links")
    .select(
      `
        token,
        cleaner:cleaners (
          id,
          user_id,
          name
        )
      `
    )
    .eq("token", token)
    .maybeSingle<CleanerLinkScheduleRecord>();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  if (!linkData || !linkData.cleaner) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  const cleaner = linkData.cleaner;

  const {
    data: propertiesData,
    error: propertiesError,
  } = await supabase
    .from("properties")
    .select(
      "id, name, cleaner, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", cleaner.user_id)
    .ilike("cleaner", cleaner.name);

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  const propertyIds = (propertiesData ?? []).map((property) => property.id);

  if (!propertyIds.length) {
    return NextResponse.json([]);
  }

  if (propertyId && !propertyIds.includes(propertyId)) {
    return NextResponse.json([]);
  }

  const filteredPropertyIds = propertyId ? [propertyId] : propertyIds;
  const propertyRecords = new Map(
    (propertiesData ?? []).map((property) => [property.id, property])
  );

  const { data: cleansData, error: cleansError } = await supabase
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
    .in("property_id", filteredPropertyIds)
    .gte("scheduled_for", from)
    .lte("scheduled_for", to)
    .neq("status", "deleted")
    .order("scheduled_for", { ascending: true });

  if (cleansError) {
    return NextResponse.json({ error: cleansError.message }, { status: 500 });
  }

  const response: ScheduleClean[] = (cleansData ?? []).map((clean: any) => {
    const property = propertyRecords.get(clean.property_id);
    return {
      id: clean.id,
      booking_uid: clean.booking_uid,
      property_id: clean.property_id,
      property_name: property?.name ?? "Unknown property",
      scheduled_for: clean.scheduled_for,
      status: clean.status,
      notes: clean.notes,
      checkin: clean.bookings?.checkin ?? null,
      checkout: clean.bookings?.checkout ?? null,
      cleaner: property?.cleaner ?? null,
    };
  });

  return NextResponse.json(response);
}
