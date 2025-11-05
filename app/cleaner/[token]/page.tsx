import { notFound } from "next/navigation";
import { getServiceSupabaseClient } from "@/lib/db";
import { CleanerPortalClient } from "./CleanerPortalClient";

type CleanerLinkRecord = {
  token: string;
  cleaner: {
    id: string;
    user_id: string;
    name: string;
    cleaner_type: "individual" | "company";
    phone?: string | null;
    notes?: string | null;
    payment_details?: string | null;
  } | null;
};

export default async function CleanerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabaseClient();

  const { data: linkData } = await supabase
    .from("cleaner_links")
    .select(
      `
        token,
        cleaner:cleaners (
          id,
          user_id,
          name,
          cleaner_type,
          phone,
          notes,
          payment_details
        )
      `
    )
    .eq("token", token)
    .maybeSingle<CleanerLinkRecord>();

  if (!linkData || !linkData.cleaner) {
    notFound();
  }

  const cleaner = linkData.cleaner;

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("id, name, cleaner, checkout_time")
    .eq("user_id", cleaner.user_id)
    .ilike("cleaner", cleaner.name);

  const properties =
    propertiesData?.map((property) => ({
      id: property.id,
      name: property.name,
      notes: null as string | null,
      checkout_time: property.checkout_time ?? null,
    })) ?? [];

  const propertyIds = properties.map((property) => property.id);

  const { data: cleansData } = propertyIds.length
    ? await supabase
        .from("cleans")
        .select("id, property_id, scheduled_for, status, notes")
        .in("property_id", propertyIds)
        .order("scheduled_for", { ascending: true })
    : { data: [] };

  const cleans =
    cleansData
      ?.filter((clean) => clean.status !== "deleted")
      .map((clean) => ({
        id: clean.id,
        property_id: clean.property_id,
        scheduled_for: clean.scheduled_for,
        status: clean.status,
        notes: clean.notes ?? null,
      })) ?? [];

  return (
    <CleanerPortalClient
      token={token}
      cleaner={{
        name: cleaner.name,
        cleaner_type: cleaner.cleaner_type,
        phone: cleaner.phone ?? null,
        notes: cleaner.notes ?? null,
        payment_details: cleaner.payment_details ?? null,
      }}
      properties={properties}
      cleans={cleans}
    />
  );
}
