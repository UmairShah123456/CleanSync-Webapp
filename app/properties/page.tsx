import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { PropertiesClient } from "./PropertiesClient";
import type { Property } from "./components/PropertyList";

export const revalidate = 0;

export default async function PropertiesPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Try to select all columns including utility fields
  let { data: propertiesData, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // If error, fallback to basic columns
  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("properties")
      .select("id, name, ical_url, checkout_time, cleaner, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    propertiesData = fallbackData?.map((property: any) => ({
      ...property,
      management_type: null,
      access_codes: null,
      bin_locations: null,
      property_address: null,
      key_locations: null,
    }));
    error = null;
  }

  const properties = propertiesData ?? [];

  return (
    <PropertiesClient
      email={user.email}
      initialProperties={properties as Property[]}
    />
  );
}
