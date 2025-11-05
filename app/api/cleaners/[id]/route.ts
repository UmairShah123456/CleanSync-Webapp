import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

const isCleanersTableMissing = (errorMessage?: string | null) => {
  if (!errorMessage) return false;
  return errorMessage.toLowerCase().includes("cleaners");
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const {
    name,
    phone,
    notes,
    payment_details,
    cleaner_type,
  }: {
    name?: string;
    phone?: string | null;
    notes?: string | null;
    payment_details?: string | null;
    cleaner_type?: string;
  } = body ?? {};

  const updatePayload: Record<string, any> = {};

  if (name !== undefined) updatePayload.name = name;
  if (phone !== undefined) updatePayload.phone = phone?.trim() || null;
  if (notes !== undefined) updatePayload.notes = notes?.trim() || null;
  if (payment_details !== undefined) {
    updatePayload.payment_details = payment_details?.trim() || null;
  }
  if (cleaner_type !== undefined) {
    if (!["individual", "company"].includes(cleaner_type)) {
      return NextResponse.json(
        { error: "Cleaner type must be either 'individual' or 'company'." },
        { status: 400 }
      );
    }
    updatePayload.cleaner_type =
      cleaner_type === "company" ? "company" : "individual";
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
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

  const { data, error } = await supabase
    .from("cleaners")
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (isCleanersTableMissing(error.message)) {
      return NextResponse.json(
        {
          error:
            "Cleaners table is missing. Please run the migration in MIGRATION_INSTRUCTIONS.md to add it.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id } = await context.params;

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

  const { error } = await supabase
    .from("cleaners")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (isCleanersTableMissing(error.message)) {
      return NextResponse.json(
        {
          error:
            "Cleaners table is missing. Please run the migration in MIGRATION_INSTRUCTIONS.md to add it.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
