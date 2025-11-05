import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { CleanersClient, type CleanerWithAssignments } from "./CleanersClient";

export const revalidate = 0;

export default async function CleanersPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: cleanersData,
    error: cleanersError,
  } = await supabase
    .from("cleaners")
    .select(
      "id, name, phone, notes, payment_details, cleaner_type, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (cleanersError && !cleanersError.message.includes("cleaners")) {
    throw new Error(cleanersError.message);
  }

  const {
    data: propertiesData,
    error: propertiesError,
  } = await supabase
    .from("properties")
    .select("id, name, cleaner")
    .eq("user_id", user.id);

  if (propertiesError) {
    throw new Error(propertiesError.message);
  }

  const cleaners: CleanerWithAssignments[] = (cleanersData ?? []).map(
    (cleaner) => {
      const normalizedName = cleaner.name?.trim().toLowerCase() ?? "";
      const assignedProperties =
        propertiesData
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
        ...cleaner,
        cleaner_type:
          cleaner.cleaner_type === "company" ? "company" : "individual",
        assigned_properties: assignedProperties,
      };
    }
  );

  return <CleanersClient email={user.email} initialCleaners={cleaners} />;
}
