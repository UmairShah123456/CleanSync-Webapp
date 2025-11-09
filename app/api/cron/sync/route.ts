import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import { syncPropertyCalendar } from "@/lib/syncUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron endpoint to sync all properties automatically
 * Secured by checking for Vercel Cron secret header
 * 
 * Schedule: Once per day at midnight UTC (Hobby plan compatible)
 * For more frequent syncing (every 6 hours), upgrade to Pro plan and change schedule to "0 *\/6 * * *"
 */
export async function GET(request: Request) {
  // Vercel cron jobs are automatically secured by Vercel
  // Optional: Add CRON_SECRET check for additional security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, require it
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if service role key is available (required for cron)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 }
    );
  }

  const supabase = getServiceSupabaseClient();

  try {
    // Fetch all properties from all users
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, user_id, name, ical_url, checkout_time");

    if (propertiesError) {
      console.error("Error fetching properties:", propertiesError);
      return NextResponse.json(
        { error: propertiesError.message },
        { status: 500 }
      );
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        message: "No properties to sync.",
        results: [],
        syncedAt: new Date().toISOString(),
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Sync each property
    for (const property of properties) {
      try {
        const stats = await syncPropertyCalendar(supabase, property);
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          userId: property.user_id,
          ...stats,
        });
        successCount++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        console.error(`Error syncing property ${property.id}:`, message);
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          userId: property.user_id,
          error: message,
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      message: `Synced ${successCount} properties successfully, ${errorCount} errors.`,
      totalProperties: properties.length,
      successCount,
      errorCount,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    console.error("Cron sync error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

