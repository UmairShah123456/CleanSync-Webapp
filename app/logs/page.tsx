import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { LogsClient } from "./LogsClient";
import type { LogRow } from "./components/LogTable";

export const revalidate = 0;

export default async function LogsPage() {
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

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("id, name")
    .eq("user_id", user.id);

  const properties = propertiesData ?? [];

  if (!properties.length) {
    return (
      <AppShell email={user.email} userName={userName}>
        <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
          Add a property to see sync activity logs.
        </div>
      </AppShell>
    );
  }

  const propertyLookup = new Map(
    properties.map((property) => [property.id, property.name])
  );
  const propertyIds = properties.map((property) => property.id);

  // Get total count
  const { count } = await supabase
    .from("sync_logs")
    .select("*", { count: "exact", head: true })
    .in("property_id", propertyIds);

  const totalCount = count ?? 0;
  // Fetch a large batch to allow client-side grouping and pagination
  const limit = 1000; // Fetch up to 1000 logs for client-side grouping
  const page = 1;

  // Get logs (fetch more to allow proper grouping on client)
  const { data: logsData } = await supabase
    .from("sync_logs")
    .select(
      "id, property_id, run_at, bookings_added, bookings_removed, bookings_updated, sync_type"
    )
    .in("property_id", propertyIds)
    .order("run_at", { ascending: false })
    .limit(limit);

  const logs = logsData ?? [];

  const tableRows: LogRow[] = logs.map((log) => ({
    ...log,
    property_name: propertyLookup.get(log.property_id) ?? "Unknown property",
  }));

  const pagination = {
    page,
    limit,
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };

  return (
    <AppShell email={user.email} userName={userName}>
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-semibold text-[#EFF6E0]">Sync activity</h2>
        <p className="mt-1 text-[#EFF6E0]/70">
          Review what changed during each background sync.
        </p>
      </div>
      <LogsClient initialLogs={tableRows} initialPagination={pagination} />
    </AppShell>
  );
}
