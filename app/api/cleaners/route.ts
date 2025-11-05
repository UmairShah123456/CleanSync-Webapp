import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";

const CLEANERS_TABLE_MISSING = "cleaners";

const isCleanersTableMissing = (errorMessage?: string | null) => {
  if (!errorMessage) return false;
  return errorMessage.toLowerCase().includes(CLEANERS_TABLE_MISSING);
};

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const view = request.nextUrl.searchParams.get("view");
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

  const {
    data: cleanersData,
    error: cleanersError,
  } = await supabase
    .from("cleaners")
    .select(
      `
        id,
        name,
        phone,
        notes,
        payment_details,
        cleaner_type,
        created_at,
        updated_at,
        cleaner_links(id, token, created_at, updated_at)
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const cleanersTableMissing = isCleanersTableMissing(cleanersError?.message);

  if (cleanersError && !cleanersTableMissing) {
    return NextResponse.json({ error: cleanersError.message }, { status: 500 });
  }

  if (view === "full") {
    if (cleanersTableMissing) {
      // Table hasn't been created yet, return empty list for the UI
      return NextResponse.json([]);
    }

    const {
      data: properties,
      error: propertiesError,
    } = await supabase
      .from("properties")
      .select("id, name, cleaner")
      .eq("user_id", user.id);

    if (propertiesError) {
      return NextResponse.json(
        { error: propertiesError.message },
        { status: 500 }
      );
    }

    const fullResponse = (cleanersData ?? []).map((cleaner) => {
      const { cleaner_links, ...rest } = cleaner as any;
      const normalizedName = rest.name?.trim().toLowerCase() ?? "";
      const assignedProperties =
        properties
          ?.filter((property) => {
            const propertyCleaner = property.cleaner?.trim().toLowerCase();
            return (
              propertyCleaner &&
              normalizedName &&
              propertyCleaner === normalizedName
            );
          })
          .map((property) => ({
            id: property.id,
            name: property.name,
          })) ?? [];

      return {
        ...rest,
        assigned_properties: assignedProperties,
        link:
          Array.isArray(cleaner_links) && cleaner_links[0]
            ? {
                id: cleaner_links[0].id,
                token: cleaner_links[0].token,
                created_at: cleaner_links[0].created_at ?? null,
                updated_at: cleaner_links[0].updated_at ?? null,
              }
            : null,
      };
    });

    return NextResponse.json(fullResponse);
  }

  // Default behaviour: return list of cleaner names (used by filters)

  const {
    data: propertyData,
    error: propertyError,
  } = await supabase
    .from("properties")
    .select("cleaner")
    .eq("user_id", user.id)
    .not("cleaner", "is", null);

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  const cleanerTableNames =
    cleanersTableMissing || !cleanersData
      ? []
      : cleanersData
          .map((cleaner) => cleaner.name?.trim())
          .filter((name): name is string => Boolean(name));

  const propertyNames = (propertyData ?? [])
    .map((property) => property.cleaner?.trim())
    .filter((name): name is string => Boolean(name));

  const uniqueNames = Array.from(
    new Set([...cleanerTableNames, ...propertyNames])
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json(uniqueNames);
}

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const body = await request.json();
  const {
    name,
    phone,
    notes,
    payment_details,
    cleaner_type,
  }: {
    name?: string;
    phone?: string;
    notes?: string;
    payment_details?: string;
    cleaner_type?: string;
  } = body ?? {};

  if (!name) {
    return NextResponse.json(
      { error: "Cleaner name is required." },
      { status: 400 }
    );
  }

  if (!cleaner_type || !["individual", "company"].includes(cleaner_type)) {
    return NextResponse.json(
      { error: "Cleaner type must be either 'individual' or 'company'." },
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

  const insertPayload = {
    name,
    phone: phone?.trim() || null,
    notes: notes?.trim() || null,
    payment_details: payment_details?.trim() || null,
    cleaner_type: cleaner_type === "company" ? "company" : "individual",
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("cleaners")
    .insert(insertPayload)
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

  return NextResponse.json(data, { status: 201 });
}
