"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "./components/DashboardHeader";
import { MetricCard } from "./components/MetricCard";
import { CleansTable, type CleanRow } from "./components/CleansTable";
import { FilterBar } from "./components/FilterBar";
import { Loader } from "@/components/ui/Loader";
import type { FilterState } from "@/components/forms/FilterForm";

async function fetchCleansWithFilters(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.propertyId) params.append("property_id", filters.propertyId);
  if (filters.status) params.append("status", filters.status);
  if (filters.from) params.append("from", filters.from);
  if (filters.to) params.append("to", filters.to);
  if (filters.cleaner) params.append("cleaner", filters.cleaner);

  const query = params.toString();
  const endpoint = query ? `/api/cleans?${query}` : "/api/cleans";

  const response = await fetch(endpoint, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cleans");
  }

  return (await response.json()) as CleanRow[];
}

// Helper function to parse time string "HH:MM" to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Helper function to extract time from ISO string and format as "HH:MM"
const extractTimeFromISO = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const calculateMetrics = (
  cleans: CleanRow[],
  propertyCheckoutTimes: Map<string, string>
) => {
  const now = Date.now();
  const inThirtyDays = now + 30 * 24 * 60 * 60 * 1000;

  let upcoming = 0;
  let issues = 0;
  let lateCheckouts = 0;
  let paymentsDue = 0;

  for (const clean of cleans) {
    const scheduled = new Date(clean.scheduled_for).getTime();
    if (
      clean.status === "scheduled" &&
      scheduled >= now &&
      scheduled <= inThirtyDays
    ) {
      upcoming += 1;
    }
    if (clean.status === "cancelled") {
      issues += 1;
    }

    // Check if checkout time is late (manually overridden to be later than property standard)
    if (clean.property_id) {
      const propertyStandardTime =
        propertyCheckoutTimes.get(clean.property_id) || "10:00";
      const cleanCheckoutTime = extractTimeFromISO(clean.scheduled_for);

      const standardMinutes = timeToMinutes(propertyStandardTime);
      const cleanMinutes = timeToMinutes(cleanCheckoutTime);

      // If clean's checkout time is later than property's standard time, it's a late checkout
      if (cleanMinutes > standardMinutes) {
        lateCheckouts += 1;
      }
    }

    if (clean.status === "completed" && scheduled < now - 24 * 60 * 60 * 1000) {
      paymentsDue += 1;
    }
  }

  return { upcoming, issues, lateCheckouts, paymentsDue } as const;
};

export function DashboardClient({
  email,
  properties,
  initialCleans,
}: {
  email?: string | null;
  properties: { id: string; name: string; checkout_time?: string | null }[];
  initialCleans: CleanRow[];
}) {
  const [cleans, setCleans] = useState(initialCleans);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create a map of property IDs to their checkout times
  const propertyCheckoutTimes = useMemo(() => {
    const map = new Map<string, string>();
    for (const property of properties) {
      map.set(property.id, property.checkout_time || "10:00");
    }
    return map;
  }, [properties]);

  const metrics = useMemo(
    () => calculateMetrics(cleans, propertyCheckoutTimes),
    [cleans, propertyCheckoutTimes]
  );

  const handleFilterChange = useCallback(async (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCleansWithFilters(nextFilters);
      setCleans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch cleans.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      setLastSynced(new Date());
      const fresh = await fetchCleansWithFilters(filters);
      setCleans(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync calendar.");
    } finally {
      setSyncing(false);
    }
  }, [filters]);

  return (
    <AppShell email={email}>
      <div className="space-y-6">
        <DashboardHeader />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2">
          <MetricCard
            value={metrics.upcoming}
            label="Upcoming Cleanings"
            subtext="Within next 30 days"
            delay={0}
          />
          <MetricCard
            value={metrics.lateCheckouts}
            label="Late Checkouts"
            subtext="Needs immediate action"
            delay={100}
          />
        </div>

        {/* Filter Bar */}
        <FilterBar
          properties={properties}
          onFilterChange={handleFilterChange}
          onSync={handleSync}
          syncing={syncing}
          lastSynced={lastSynced}
        />

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center rounded-xl bg-[#124559] p-12 border border-[#124559]/50">
            <Loader />
          </div>
        ) : (
          <CleansTable
            cleans={cleans}
            onDelete={async (id) => {
              const fresh = await fetchCleansWithFilters(filters);
              setCleans(fresh);
            }}
            onStatusUpdate={async () => {
              const fresh = await fetchCleansWithFilters(filters);
              setCleans(fresh);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
