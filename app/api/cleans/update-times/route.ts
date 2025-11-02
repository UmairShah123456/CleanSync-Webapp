import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await getServerSupabaseClient();

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

  // Get all properties owned by the user
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", user.id);

  if (propertiesError) {
    return NextResponse.json(
      { error: propertiesError.message },
      { status: 500 }
    );
  }

  if (!properties || properties.length === 0) {
    return NextResponse.json({
      message: "No properties found",
      updated: 0,
    });
  }

  const propertyIds = properties.map((p) => p.id);

  // Get all cleans for these properties
  const { data: cleans, error: cleansError } = await supabase
    .from("cleans")
    .select("id, scheduled_for")
    .in("property_id", propertyIds);

  if (cleansError) {
    return NextResponse.json({ error: cleansError.message }, { status: 500 });
  }

  if (!cleans || cleans.length === 0) {
    return NextResponse.json({
      message: "No cleans found",
      updated: 0,
    });
  }

  let updatedCount = 0;
  const errors: string[] = [];

  // Update each clean to have 10:00 AM on the same date
  for (const clean of cleans) {
    const scheduledDate = new Date(clean.scheduled_for);
    // Set time to 10:00 AM on the same date
    scheduledDate.setHours(10, 0, 0, 0);

    const { error: updateError } = await supabase
      .from("cleans")
      .update({
        scheduled_for: scheduledDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", clean.id);

    if (updateError) {
      errors.push(`Failed to update clean ${clean.id}: ${updateError.message}`);
    } else {
      updatedCount++;
    }
  }

  return NextResponse.json({
    message: "Time updates completed",
    updated: updatedCount,
    total: cleans.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
