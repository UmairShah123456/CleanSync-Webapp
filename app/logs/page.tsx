import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { LogTable } from "./components/LogTable";
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

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("id, name")
    .eq("user_id", user.id);

  const properties = propertiesData ?? [];

  if (!properties.length) {
    return (
      <AppShell email={user.email}>
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

  const { data: logsData } = await supabase
    .from("sync_logs")
    .select(
      "id, property_id, run_at, bookings_added, bookings_removed, bookings_updated"
    )
    .in("property_id", propertyIds)
    .order("run_at", { ascending: false })
    .limit(50);

  const logs = logsData ?? [];

  const tableRows: LogRow[] = logs.map((log) => ({
    ...log,
    property_name: propertyLookup.get(log.property_id) ?? "Unknown property",
  }));

  return (
    <AppShell email={user.email}>
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-semibold text-[#EFF6E0]">Sync activity</h2>
        <p className="mt-1 text-[#EFF6E0]/70">
          Review what changed during each background sync.
        </p>
      </div>
      <LogTable logs={tableRows} />
    </AppShell>
  );
}
