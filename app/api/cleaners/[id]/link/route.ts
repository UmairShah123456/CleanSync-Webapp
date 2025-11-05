import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSupabaseClient } from "@/lib/db";

const generateToken = () => {
  return randomUUID().replace(/-/g, "");
};

const cleanersTableMissing = (message?: string | null) =>
  message?.toLowerCase().includes("cleaners") ?? false;

const cleanerLinksTableMissing = (message?: string | null) =>
  message?.toLowerCase().includes("cleaner_links") ?? false;

const ensureCleaner = async (supabase: any, userId: string, cleanerId: string) => {
  const { data, error } = await supabase
    .from("cleaners")
    .select("id, user_id, name, cleaner_type")
    .eq("user_id", userId)
    .eq("id", cleanerId)
    .maybeSingle();
  if (error) {
    if (cleanersTableMissing(error.message)) {
      return { error: "Cleaners table is missing. Run the migration first." };
    }
    return { error: error.message };
  }
  if (!data) {
    return { error: "Cleaner not found." };
  }
  return { cleaner: data };
};

const fetchLink = async (supabase: any, cleanerId: string) => {
  const { data, error } = await supabase
    .from("cleaner_links")
    .select("id, token, created_at, updated_at")
    .eq("cleaner_id", cleanerId)
    .maybeSingle();

  if (error) {
    if (cleanerLinksTableMissing(error.message)) {
      return { error: "Cleaner links table is missing. Run the migration first." };
    }
    return { error: error.message };
  }
  return { link: data ?? null };
};

export async function POST(
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

  const { cleaner, error: cleanerError } = await ensureCleaner(
    supabase,
    user.id,
    id
  );
  if (cleanerError) {
    return NextResponse.json({ error: cleanerError }, { status: 400 });
  }

  const { link, error: linkError } = await fetchLink(supabase, id);
  if (linkError) {
    return NextResponse.json({ error: linkError }, { status: 400 });
  }

  if (link) {
    return NextResponse.json({ ...link, cleaner_type: cleaner!.cleaner_type });
  }

  const token = generateToken();
  const { data, error } = await supabase
    .from("cleaner_links")
    .insert({ cleaner_id: id, token })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, cleaner_type: cleaner!.cleaner_type });
}

export async function PATCH(
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

  const { cleaner, error: cleanerError } = await ensureCleaner(
    supabase,
    user.id,
    id
  );
  if (cleanerError) {
    return NextResponse.json({ error: cleanerError }, { status: 400 });
  }

  const { link, error: linkError } = await fetchLink(supabase, id);
  if (linkError) {
    return NextResponse.json({ error: linkError }, { status: 400 });
  }

  const token = generateToken();

  if (link) {
    const { data, error } = await supabase
      .from("cleaner_links")
      .update({ token, updated_at: new Date().toISOString() })
      .eq("id", link.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, cleaner_type: cleaner!.cleaner_type });
  }

  const { data, error } = await supabase
    .from("cleaner_links")
    .insert({ cleaner_id: id, token })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, cleaner_type: cleaner!.cleaner_type });
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

  const { cleaner, error: cleanerError } = await ensureCleaner(
    supabase,
    user.id,
    id
  );
  if (cleanerError) {
    return NextResponse.json({ error: cleanerError }, { status: 400 });
  }

  const { error } = await supabase
    .from("cleaner_links")
    .delete()
    .eq("cleaner_id", id);

  if (error) {
    if (cleanerLinksTableMissing(error.message)) {
      return NextResponse.json(
        {
          error:
            "Cleaner links table is missing. Please run the migration in MIGRATION_INSTRUCTIONS.md to add it.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, cleaner_type: cleaner!.cleaner_type });
}
