import { NextResponse } from "next/server";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/db";
import { syncPropertyCalendar } from "@/lib/syncUtils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const adminClient = getServiceSupabaseClient();
  const payload = await request
    .json()
    .catch(() => ({} as { propertyId?: string }));

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

  let query = supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id);

  if (payload.propertyId) {
    query = query.eq("id", payload.propertyId);
  }

  const { data: properties, error: propertiesError } = await query;

  if (propertiesError) {
    return NextResponse.json(
      { error: propertiesError.message },
      { status: 500 }
    );
  }

  if (!properties || properties.length === 0) {
    return NextResponse.json({
      message: "No properties to sync.",
      results: [],
    });
  }

  const results = [];

  for (const property of properties) {
    try {
      const stats = await syncPropertyCalendar(adminClient, property);
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        ...stats,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        error: message,
      });
    }
  }

  return NextResponse.json({ results });
}
