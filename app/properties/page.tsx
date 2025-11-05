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

  const columnsWithManagement =
    "id, name, ical_url, checkout_time, cleaner, management_type, created_at";
  let { data: propertiesData, error } = await supabase
    .from("properties")
    .select(columnsWithManagement)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error && error.message.includes("management_type")) {
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
    }));
    error = null;
  } else if (error) {
    throw new Error(error.message);
  }

  const properties = propertiesData ?? [];

  return (
    <PropertiesClient
      email={user.email}
      initialProperties={properties as Property[]}
    />
  );
}
