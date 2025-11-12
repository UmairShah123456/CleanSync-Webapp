import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const {
    name,
    ical_url,
    checkout_time,
    cleaner,
    access_codes,
    bin_locations,
    property_address,
    key_locations,
  } = body ?? {};

  const updatePayload: Record<string, any> = {};
  if (name) updatePayload.name = name;
  if (ical_url) updatePayload.ical_url = ical_url;
  if (checkout_time !== undefined) updatePayload.checkout_time = checkout_time;
  if (cleaner !== undefined) {
    updatePayload.cleaner = cleaner?.trim() || null;
  }
  if (access_codes !== undefined) {
    updatePayload.access_codes = access_codes?.trim() || null;
  }
  if (bin_locations !== undefined) {
    updatePayload.bin_locations = bin_locations?.trim() || null;
  }
  if (property_address !== undefined) {
    updatePayload.property_address = property_address?.trim() || null;
  }
  if (key_locations !== undefined) {
    updatePayload.key_locations = key_locations?.trim() || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
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
    .from("properties")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(
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

  // Get the property
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the property's cleaning checklists
 const { data: checklists } = await supabase
    .from("cleaning_checklists")
    .select("*")
    .eq("property_id", id)
    .order("sort_order", { ascending: true });

  // Return property with its checklists
  return NextResponse.json({
    ...property,
    cleaning_checklists: checklists || [],
  });
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
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
