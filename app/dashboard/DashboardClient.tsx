"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "./components/DashboardHeader";
import { MetricCard } from "./components/MetricCard";
import { CleansTable, type CleanRow } from "./components/CleansTable";
import { FilterBar } from "./components/FilterBar";
import type { FilterState } from "@/components/forms/FilterForm";

async function fetchCleansWithFilters(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.propertyId) params.append("property_id", filters.propertyId);
  if (filters.status) params.append("status", filters.status);
  if (filters.from) params.append("from", filters.from);
  if (filters.to) params.append("to", filters.to);

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

const calculateMetrics = (cleans: CleanRow[]) => {
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
    if (
      clean.notes?.includes("⚠️") ||
      clean.notes?.toLowerCase().includes("late")
    ) {
      lateCheckouts += 1;
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
  properties: { id: string; name: string }[];
  initialCleans: CleanRow[];
}) {
  const [cleans, setCleans] = useState(initialCleans);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => calculateMetrics(cleans), [cleans]);

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
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            value={metrics.upcoming}
            label="Upcoming Cleanings"
            subtext="Within next 30 days"
            delay={0}
          />
          <MetricCard
            value={metrics.issues}
            label="Issues to Resolve"
            subtext="Requires attention"
            delay={100}
          />
          <MetricCard
            value={metrics.lateCheckouts}
            label="Late Checkouts"
            subtext="Needs immediate action"
            delay={200}
          />
          <MetricCard
            value={metrics.paymentsDue}
            label="Payments Due"
            subtext="Pending payment"
            delay={300}
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
          <div className="flex items-center justify-center rounded-xl bg-[#124559] p-12 text-sm text-[#EFF6E0]/70 border border-[#124559]/50">
            Loading cleans...
          </div>
        ) : (
          <CleansTable cleans={cleans} />
        )}
      </div>
    </AppShell>
  );
}
