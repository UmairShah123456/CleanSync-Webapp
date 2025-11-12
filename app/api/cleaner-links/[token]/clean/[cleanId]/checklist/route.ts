import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import {
  CleanerAccessError,
  ensureIndividualCleanerAccess,
  fetchCleanWithRelations,
  mapCleanRecordToScheduleClean,
} from "../../../../utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ token: string; cleanId: string }> }
) {
  const { token, cleanId } = await context.params;
  const body = await request.json();
  const { checklist_item_id, completed } = body;

  if (!checklist_item_id || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "checklist_item_id and completed status are required." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { clean: cleanData } = await ensureIndividualCleanerAccess(
      supabase,
      token,
      cleanId
    );

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
        throw new CleanerAccessError(error.message, 500);
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
        throw new CleanerAccessError(error.message, 500);
      }
    }

    // Fetch the updated clean with all relations
    const cleanRecord = await fetchCleanWithRelations(supabase, cleanId);

    // Get property data for mapping
    const { data: propertyData } = await supabase
      .from("properties")
      .select(
        "id, name, cleaner, user_id, checkout_time, access_codes, bin_locations, property_address, key_locations"
      )
      .eq("id", cleanRecord.property_id)
      .maybeSingle();

    if (!propertyData) {
      throw new CleanerAccessError("Property not found.", 404);
    }

    const clean = mapCleanRecordToScheduleClean(cleanRecord, propertyData);

    return NextResponse.json({ clean });
  } catch (error) {
    if (error instanceof CleanerAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    // Type guard for unknown error
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Unable to update checklist completion." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to update checklist completion." },
      { status: 500 }
    );
  }
}
