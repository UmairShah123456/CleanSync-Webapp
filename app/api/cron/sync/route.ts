import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import { syncPropertyCalendar } from "@/lib/syncUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Vercel Cron sends this header - only Vercel can send this
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  // During Vercel's deployment validation, they check if the endpoint exists
  // Return early with success for validation (when x-vercel-cron is not present)
  // This allows Vercel to validate the cron path without requiring auth
  if (!isVercelCron) {
    // Check if this is likely a validation check (no auth headers)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(request.url);
    const providedSecret =
      authHeader?.replace("Bearer ", "") ||
      request.headers.get("x-cron-secret") ||
      url.searchParams.get("secret");

    // If no secret is provided and CRON_SECRET is set, this might be a validation check
    // Allow it to pass validation, but don't run the actual sync
    if (!providedSecret) {
      // This is likely Vercel's validation check - return success
      return NextResponse.json({
        message: "Cron endpoint is ready",
        status: "ok",
        note: "Actual sync requires authentication",
      });
    }

    // If secret is provided but doesn't match, return unauthorized
    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If CRON_SECRET is not set at all, warn but allow (for initial setup)
    if (!cronSecret) {
      console.warn(
        "CRON_SECRET environment variable is not set - cron job may not be secure"
      );
    }
  }

  const adminClient = getServiceSupabaseClient();

  try {
    // Fetch all properties that need syncing
    const { data: properties, error: propertiesError } = await adminClient
      .from("properties")
      .select("*");

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
    const startTime = Date.now();

    // Sync each property
    for (const property of properties) {
      try {
        const stats = await syncPropertyCalendar(adminClient, property);
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          ...stats,
          success: true,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        console.error(
          `Error syncing property ${property.id} (${property.name}):`,
          error
        );
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          error: message,
          success: false,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: "Sync completed",
      syncedAt: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        totalProperties: properties.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error("Unexpected error during cron sync:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Also support POST for services that prefer POST
export async function POST(request: Request) {
  return GET(request);
}
