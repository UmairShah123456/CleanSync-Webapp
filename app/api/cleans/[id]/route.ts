import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  const body = await request
    .json()
    .catch(
      () =>
        ({
          status: undefined,
          scheduled_for: undefined,
          maintenance_notes: undefined,
        } as {
          status?: string;
          scheduled_for?: string;
          maintenance_notes?: string[];
        })
    );
  const { status, scheduled_for, maintenance_notes } = body;

  // Validate that at least one field is provided
  if (!status && !scheduled_for && !maintenance_notes) {
    return NextResponse.json(
      { error: "Status, scheduled_for, or maintenance_notes is required" },
      { status: 400 }
    );
  }

  // Validate status value if provided
  if (status) {
    const validStatuses = ["scheduled", "completed", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  // First, verify the clean belongs to a property owned by the user
  const { data: clean, error: cleanError } = await supabase
    .from("cleans")
    .select(
      `
      id,
      property_id,
      properties!inner(user_id)
    `
    )
    .eq("id", id)
    .single();

  if (cleanError) {
    return NextResponse.json({ error: cleanError.message }, { status: 500 });
  }

  if (!clean) {
    return NextResponse.json({ error: "Clean not found" }, { status: 404 });
  }

  // Check if the property belongs to the user
  if ((clean.properties as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Prepare update data
  const updateData: {
    status?: string;
    scheduled_for?: string;
    maintenance_notes?: string[];
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updateData.status = status.toLowerCase();
  }

  if (scheduled_for) {
    // Validate the date format
    const date = new Date(scheduled_for);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled_for date format" },
        { status: 400 }
      );
    }
    updateData.scheduled_for = date.toISOString();
  }

  if (maintenance_notes) {
    if (
      !Array.isArray(maintenance_notes) ||
      maintenance_notes.some((note) => typeof note !== "string")
    ) {
      return NextResponse.json(
        { error: "maintenance_notes must be an array of strings" },
        { status: 400 }
      );
    }

    const normalizedNotes = Array.from(
      new Set(
        maintenance_notes
          .map((note) => note.trim())
          .filter((note) => note.length > 0)
      )
    );
    updateData.maintenance_notes = normalizedNotes;
  }

  // Update the clean
  const { error: updateError } = await supabase
    .from("cleans")
    .update(updateData)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Clean status updated successfully" });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  // First, verify the clean belongs to a property owned by the user
  const { data: clean, error: cleanError } = await supabase
    .from("cleans")
    .select(
      `
      id,
      property_id,
      properties!inner(user_id)
    `
    )
    .eq("id", id)
    .single();

  if (cleanError) {
    return NextResponse.json({ error: cleanError.message }, { status: 500 });
  }

  if (!clean) {
    return NextResponse.json({ error: "Clean not found" }, { status: 404 });
  }

  // Check if the property belongs to the user
  if ((clean.properties as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Mark the clean as deleted (soft delete)
  const { error: updateError } = await supabase
    .from("cleans")
    .update({
      status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Clean deleted successfully" });
}
