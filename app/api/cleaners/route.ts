import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/cleaners
 * Returns a list of all unique cleaner names from properties belonging to the authenticated user
 */
export async function GET() {
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

  // Get all properties for this user and extract unique cleaner names
  const { data: properties, error } = await supabase
    .from("properties")
    .select("cleaner")
    .eq("user_id", user.id)
    .not("cleaner", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract unique, non-empty cleaner names
  const cleaners = Array.from(
    new Set(
      (properties ?? [])
        .map((p) => p.cleaner?.trim())
        .filter((name): name is string => !!name)
    )
  ).sort();

  return NextResponse.json(cleaners);
}
