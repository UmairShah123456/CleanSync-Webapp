import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id, itemId } = await context.params;

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

  // Verify property belongs to user
  const { error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (propertyError) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Verify checklist item belongs to the property
  const { error: itemError } = await supabase
    .from("cleaning_checklists")
    .delete()
    .eq("id", itemId)
    .eq("property_id", id);

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}