import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json(
      { error: userError.message },
      { status: 500 }
    );
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

  const { data, error } = await supabase
    .from("sync_logs")
    .select("id, property_id, run_at, bookings_added, bookings_removed, bookings_updated")
    .in("property_id", propertyIds)
    .order("run_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = (data ?? []).map((log) => ({
    ...log,
    property_name: propertyLookup.get(log.property_id) ?? "Unknown property",
  }));

  return NextResponse.json(response);
}
