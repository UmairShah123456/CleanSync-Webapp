import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/db";
import {
  fetchCleanWithRelations,
  mapCleanRecordToScheduleClean,
} from "@/app/api/cleaner-links/utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id: cleanId } = await context.params;
  const body = await request.json();
  const { checklist_item_id, completed } = body;

  if (!checklist_item_id || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "checklist_item_id and completed status are required." },
      { status: 400 }
    );
  }

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

  // Verify that the clean belongs to a property owned by the user
  const { data: cleanData, error: cleanError } = await supabase
    .from("cleans")
    .select("property_id")
    .eq("id", cleanId)
    .single();

  if (cleanError || !cleanData) {
    return NextResponse.json({ error: "Clean not found" }, { status: 404 });
  }

  // Verify that the checklist item belongs to the same property as the clean
  const { error: checklistError } = await supabase
    .from("cleaning_checklists")
    .select("id")
    .eq("id", checklist_item_id)
    .eq("property_id", cleanData.property_id)
    .single();

  if (checklistError) {
    return NextResponse.json(
      { error: "Checklist item not found" },
      { status: 404 }
    );
  }

  // Check if a completion record already exists
  const { data: existingCompletion } = await supabase
    .from("clean_checklist_completions")
    .select("id")
    .eq("clean_id", cleanId)
    .eq("checklist_item_id", checklist_item_id)
    .single();

  if (existingCompletion) {
    // Update existing completion
    const { error } = await supabase
      .from("clean_checklist_completions")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCompletion.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Create new completion
    const { error } = await supabase
      .from("clean_checklist_completions")
      .insert({
        clean_id: cleanId,
        checklist_item_id,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Fetch the updated clean with all relations using service client
  const serviceClient = getServiceSupabaseClient();
  const cleanRecord = await fetchCleanWithRelations(serviceClient, cleanId);

  // Get property data for mapping
  const { data: propertyData } = await serviceClient
    .from("properties")
    .select(
      "id, name, cleaner, user_id, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("id", cleanRecord.property_id)
    .maybeSingle();

  if (!propertyData) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const clean = mapCleanRecordToScheduleClean(cleanRecord, propertyData);

  return NextResponse.json({ clean });
}
