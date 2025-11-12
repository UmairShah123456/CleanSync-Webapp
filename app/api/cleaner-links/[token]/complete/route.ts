import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";

type CleanerLinkRecord = {
  id: string;
  cleaner: {
    id: string;
    user_id: string;
    name: string;
    cleaner_type: "individual" | "company";
  } | null;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const body = await request.json();
  const cleanId = body?.clean_id as string | undefined;

  if (!cleanId) {
    return NextResponse.json({ error: "Missing clean id." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();

  const { data: linkData, error: linkError } = await supabase
    .from("cleaner_links")
    .select(
      `
        id,
        cleaner:cleaners (
          id,
          user_id,
          name,
          cleaner_type
        )
      `
    )
    .eq("token", token)
    .maybeSingle<CleanerLinkRecord>();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  if (!linkData || !linkData.cleaner) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  const { data: cleanRecord, error: cleanError } = await supabase
    .from("cleans")
    .select("id, property_id, status")
    .eq("id", cleanId)
    .maybeSingle();

  if (cleanError) {
    return NextResponse.json({ error: cleanError.message }, { status: 500 });
  }

  if (!cleanRecord) {
    return NextResponse.json({ error: "Clean not found." }, { status: 404 });
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, cleaner")
    .eq("id", cleanRecord.property_id)
    .maybeSingle();

  const cleanerName = linkData.cleaner.name.trim().toLowerCase();
  const propertyCleaner = property?.cleaner?.trim().toLowerCase();

  if (!property || !propertyCleaner || propertyCleaner !== cleanerName) {
    return NextResponse.json({ error: "This clean is not assigned to the cleaner." }, { status: 403 });
  }

  if (cleanRecord.status === "completed") {
    return NextResponse.json({ success: true });
  }

  const { error: updateError } = await supabase
    .from("cleans")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", cleanId)
    .eq("status", "scheduled");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
