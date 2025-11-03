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

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("id, name, ical_url, checkout_time, cleaner, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const properties = propertiesData ?? [];

  return (
    <PropertiesClient
      email={user.email}
      initialProperties={properties as Property[]}
    />
  );
}
