import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export async function GET(
  request: NextRequest,
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

  const { data, error } = await supabase
    .from("cleaning_checklists")
    .select("*")
    .eq("property_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const { room, task, sort_order } = body;

  if (!room || !task) {
    return NextResponse.json(
      { error: "Room and task are required." },
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

  const insertData = {
    property_id: id,
    room,
    task,
    sort_order: sort_order || 0,
  };

  const { data, error } = await supabase
    .from("cleaning_checklists")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}