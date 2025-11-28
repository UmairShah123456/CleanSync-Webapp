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
    return NextResponse.json({ error: "Missing date range." }, { status: 400 });
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

  // Get properties with their basic details
  const { data: propertiesData, error: propertiesError } = await supabase
    .from("properties")
    .select(
      "id, name, cleaner, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("user_id", cleaner.user_id)
    .ilike("cleaner", cleaner.name);

  if (propertiesError) {
    return NextResponse.json(
      { error: propertiesError.message },
      { status: 500 }
    );
  }

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

  const propertyIds = (propertiesWithChecklists ?? []).map(
    (property) => property.id
  );

  if (!propertyIds.length) {
    return NextResponse.json([]);
  }

  if (propertyId && !propertyIds.includes(propertyId)) {
    return NextResponse.json([]);
  }

  const filteredPropertyIds = propertyId ? [propertyId] : propertyIds;
  const propertyRecords = new Map(
    (propertiesWithChecklists ?? []).map((property) => [property.id, property])
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
        maintenance_notes,
        clean_reimbursements ( id, amount, item, created_at )
      `
    )
    .in("property_id", filteredPropertyIds)
    .gte("scheduled_for", from)
    .lte("scheduled_for", to)
    .neq("status", "deleted")
    .neq("status", "cancelled")
    .order("scheduled_for", { ascending: true });

  if (cleansError) {
    return NextResponse.json({ error: cleansError.message }, { status: 500 });
  }

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
      .in("property_id", filteredPropertyIds);

    if (bookings) {
      bookings.forEach((b: any) => {
        const key = `${b.uid}:${b.property_id}`;
        bookingMap.set(key, { checkin: b.checkin, checkout: b.checkout });
      });
    }
  }

  // Fetch checklist completions separately
  const cleanIds = (cleansData ?? []).map((c: any) => c.id);
  const checklistCompletionsMap = new Map<
    string,
    Array<{
      id: string;
      checklist_item_id: string;
      completed: boolean;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    }>
  >();

  if (cleanIds.length > 0) {
    const { data: completions } = await supabase
      .from("clean_checklist_completions")
      .select(
        "id, clean_id, checklist_item_id, completed, completed_at, created_at, updated_at"
      )
      .in("clean_id", cleanIds);

    if (completions) {
      completions.forEach((comp: any) => {
        const existing = checklistCompletionsMap.get(comp.clean_id) || [];
        existing.push({
          id: comp.id,
          checklist_item_id: comp.checklist_item_id,
          completed: comp.completed,
          completed_at: comp.completed_at,
          created_at: comp.created_at,
          updated_at: comp.updated_at,
        });
        checklistCompletionsMap.set(comp.clean_id, existing);
      });
    }
  }

  const response: ScheduleClean[] = (cleansData ?? []).map((clean: any) => {
    const property = propertyRecords.get(clean.property_id);
    // Match booking by both uid and property_id
    const bookingKey = clean.booking_uid
      ? `${clean.booking_uid}:${clean.property_id}`
      : null;
    const booking = bookingKey ? bookingMap.get(bookingKey) : null;

    return {
      id: clean.id,
      booking_uid: clean.booking_uid,
      property_id: clean.property_id,
      property_name: property?.name ?? "Unknown property",
      scheduled_for: clean.scheduled_for,
      status: clean.status,
      notes: clean.notes,
      checkin: booking?.checkin ?? null,
      checkout: booking?.checkout ?? null,
      cleaner: property?.cleaner ?? null,
      maintenance_notes: clean.maintenance_notes ?? [],
      reimbursements:
        (clean.clean_reimbursements ?? []).map((entry: any) => ({
          id: entry.id,
          amount: Number(entry.amount),
          item: entry.item,
          created_at: entry.created_at,
        })) ?? [],
      checklist_completions: checklistCompletionsMap.get(clean.id) ?? [],
    };
  });

  return NextResponse.json(response);
}
