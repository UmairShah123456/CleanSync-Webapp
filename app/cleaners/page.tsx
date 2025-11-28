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

  // Fetch user profile to get first and last name
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const userName = profileData
    ? `${profileData.first_name} ${profileData.last_name}`.trim()
    : null;

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
        cleaner_links(id, token, created_at, updated_at)
      `
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
      const { cleaner_links, ...rest } = cleaner as any;
      const normalizedName = rest.name?.trim().toLowerCase() ?? "";
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
      const link = Array.isArray(cleaner_links)
        ? cleaner_links[0] ?? null
        : null;
      return {
        ...rest,
        cleaner_type:
          rest.cleaner_type === "company" ? "company" : "individual",
        assigned_properties: assignedProperties,
        link:
          link && link.token
            ? {
                id: link.id,
                token: link.token,
                created_at: link.created_at ?? null,
                updated_at: link.updated_at ?? null,
              }
            : null,
      };
    }
  );

  return <CleanersClient email={user.email} userName={userName} initialCleaners={cleaners} />;
}
