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
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First get properties
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  // For each property, get its cleaning checklists
  const propertiesWithChecklists = await Promise.all(
    properties.map(async (property) => {
      const { data: checklists } = await supabase
        .from("cleaning_checklists")
        .select("*")
        .eq("property_id", property.id)
        .order("sort_order", { ascending: true });
      
      return {
        ...property,
        cleaning_checklists: checklists || [],
      };
    })
  );

  return NextResponse.json(propertiesWithChecklists);
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const body = await request.json();
  const { name, ical_url, checkout_time, cleaner } = body ?? {};

  if (!name || !ical_url) {
    return NextResponse.json(
      { error: "Name and iCal URL are required." },
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

  const insertData: Record<string, any> = {
    name,
    ical_url,
    checkout_time: checkout_time || "10:00",
    user_id: user.id,
  };

  if (cleaner !== undefined) {
    insertData.cleaner = cleaner.trim() || null;
  }

  const { data, error } = await supabase
    .from("properties")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
