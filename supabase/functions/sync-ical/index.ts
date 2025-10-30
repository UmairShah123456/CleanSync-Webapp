import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getServiceClient } from "./supabaseClient.ts";
import { syncProperty } from "./icalUtils.ts";

serve(async () => {
  const supabase = getServiceClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, ical_url");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!properties || properties.length === 0) {
    return new Response(
      JSON.stringify({ message: "No properties found.", results: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const results = [];

  for (const property of properties) {
    try {
      const stats = await syncProperty(supabase, property);
      results.push({ propertyId: property.id, ...stats });
    } catch (err) {
      results.push({
        propertyId: property.id,
        error: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
