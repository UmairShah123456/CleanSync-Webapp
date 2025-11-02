import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import { syncPropertyCalendar } from "@/lib/syncUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Verify the request has the correct authorization token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron sends this header - only Vercel can send this
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json(
      { error: "Cron job not configured" },
      { status: 500 }
    );
  }

  // Get secret from multiple sources (for flexibility with different cron services)
  const url = new URL(request.url);
  const providedSecret =
    authHeader?.replace("Bearer ", "") ||
    request.headers.get("x-cron-secret") ||
    url.searchParams.get("secret"); // Query parameter (for Vercel Cron convenience)

  // For Vercel Cron, trust the x-vercel-cron header (only Vercel can send this)
  // For other cron services, require the secret
  if (isVercelCron) {
    // Vercel Cron is trusted - the x-vercel-cron header can only be set by Vercel
    console.log("Vercel cron request authenticated via x-vercel-cron header");
  } else if (!providedSecret || providedSecret !== cronSecret) {
    // For non-Vercel requests, require the secret
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
