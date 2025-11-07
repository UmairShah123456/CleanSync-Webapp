"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "./components/DashboardHeader";
import { MetricCard } from "./components/MetricCard";
import { CleansTable, type CleanRow } from "./components/CleansTable";
import { FilterBar } from "./components/FilterBar";
import { Loader } from "@/components/ui/Loader";
import type { FilterState } from "@/components/forms/FilterForm";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { CleanActionsModal } from "@/components/clean/CleanActionsModal";
import type { ScheduleClean, ScheduleProperty } from "@/app/schedule/types";

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

  const data = (await response.json()) as Array<{
    id: string;
    booking_uid: string;
    property_id: string;
    property_name: string;
    scheduled_for: string;
    status: string;
    notes?: string | null;
    checkin?: string | null;
    checkout?: string | null;
    cleaner?: string | null;
    maintenance_notes?: string[] | null;
    reimbursements?: Array<{
      id: string;
      amount: number;
      item: string;
      created_at: string;
    }>;
  }>;

  return data.map((clean) => ({
    id: clean.id,
    booking_uid: clean.booking_uid,
    property_id: clean.property_id,
    property_name: clean.property_name,
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes ?? null,
    checkin: clean.checkin ?? null,
    checkout: clean.checkout ?? null,
    cleaner: clean.cleaner ?? null,
    maintenance_notes: clean.maintenance_notes ?? [],
    reimbursements: (clean.reimbursements ?? []).map((entry) => ({
      id: entry.id,
      amount: Number(entry.amount),
      item: entry.item,
      created_at: entry.created_at,
    })),
  }));
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
  cleanerTypeMap,
}: {
  email?: string | null;
  properties: Array<{
    id: string;
    name: string;
    checkout_time?: string | null;
    cleaner?: string | null;
    access_codes?: string | null;
    bin_locations?: string | null;
    property_address?: string | null;
    key_locations?: string | null;
  }>;
  initialCleans: CleanRow[];
  cleanerTypeMap: Array<[string, "individual" | "company"]>;
}) {
  const [cleans, setCleans] = useState(initialCleans);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncMessageVisible, setSyncMessageVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "self-managed" | "company-managed"
  >("all");
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const propertyDetailsMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties]
  );
  // Convert array of tuples back to Map for efficient lookups
  const cleanerTypeMapLookup = useMemo(
    () => new Map<string, "individual" | "company">(cleanerTypeMap),
    [cleanerTypeMap]
  );
  const [managedClean, setManagedClean] = useState<{
    clean: ScheduleClean;
    property: ScheduleProperty | null;
  } | null>(null);

  // Create a map of property IDs to their checkout times
  const propertyCheckoutTimes = useMemo(() => {
    const map = new Map<string, string>();
    for (const property of properties) {
      map.set(property.id, property.checkout_time || "10:00");
    }
    return map;
  }, [properties]);

  const mapRowToScheduleClean = useCallback(
    (row: CleanRow): ScheduleClean => ({
      id: row.id,
      booking_uid: row.booking_uid,
      property_id: row.property_id,
      property_name: row.property_name,
      scheduled_for: row.scheduled_for,
      status: row.status,
      notes: row.notes ?? null,
      checkin: row.checkin ?? null,
      checkout: row.checkout ?? null,
      cleaner: row.cleaner ?? null,
      maintenance_notes: row.maintenance_notes ?? [],
      reimbursements: (row.reimbursements ?? []).map((entry) => ({
        id: entry.id,
        amount: Number(entry.amount),
        item: entry.item,
        created_at: entry.created_at,
      })),
    }),
    []
  );

  const mapScheduleCleanToRow = useCallback(
    (clean: ScheduleClean, previous?: CleanRow): CleanRow => ({
      id: clean.id,
      booking_uid: clean.booking_uid,
      property_id: clean.property_id,
      property_name: clean.property_name,
      scheduled_for: clean.scheduled_for,
      status: clean.status,
      notes: clean.notes ?? null,
      property_unit: previous?.property_unit,
      checkin: clean.checkin ?? null,
      checkout: clean.checkout ?? null,
      cleaner: clean.cleaner ?? null,
      maintenance_notes: clean.maintenance_notes ?? [],
      reimbursements: (clean.reimbursements ?? []).map((entry) => ({
        id: entry.id,
        amount: Number(entry.amount),
        item: entry.item,
        created_at: entry.created_at,
      })),
    }),
    []
  );

  // Filter cleans based on active tab
  const filteredCleans = useMemo(() => {
    if (activeTab === "all") {
      return cleans;
    }

    return cleans.filter((clean) => {
      const property = propertyDetailsMap.get(clean.property_id);
      if (!property || !property.cleaner) {
        // Properties with no cleaner assigned only show in "All cleans"
        return false;
      }

      const normalizedCleanerName = property.cleaner.trim().toLowerCase();
      const cleanerType = cleanerTypeMapLookup.get(normalizedCleanerName);

      if (activeTab === "self-managed") {
        return cleanerType === "individual";
      } else if (activeTab === "company-managed") {
        return cleanerType === "company";
      }

      return false;
    });
  }, [cleans, activeTab, propertyDetailsMap, cleanerTypeMapLookup]);

  const metrics = useMemo(
    () => calculateMetrics(filteredCleans, propertyCheckoutTimes),
    [filteredCleans, propertyCheckoutTimes]
  );

  const refreshCleans = useCallback(async () => {
    try {
      const data = await fetchCleansWithFilters(filters);
      setCleans(data);
    } catch (err) {
      console.error("Failed to refresh cleans from realtime update.", err);
    }
  }, [filters]);

  const handleManageClean = useCallback(
    (row: CleanRow) => {
      const propertyInfo = propertyDetailsMap.get(row.property_id);
      const property: ScheduleProperty | null = propertyInfo
        ? {
            id: propertyInfo.id,
            name: propertyInfo.name,
            checkout_time: propertyInfo.checkout_time ?? "10:00",
            cleaner: propertyInfo.cleaner ?? row.cleaner ?? null,
            access_codes: propertyInfo.access_codes ?? null,
            bin_locations: propertyInfo.bin_locations ?? null,
            property_address: propertyInfo.property_address ?? null,
            key_locations: propertyInfo.key_locations ?? null,
          }
        : null;

      setManagedClean({
        clean: mapRowToScheduleClean(row),
        property,
      });
    },
    [mapRowToScheduleClean, propertyDetailsMap]
  );

  const closeManagedClean = useCallback(() => {
    setManagedClean(null);
  }, []);

  const handleManagedCleanUpdated = useCallback(
    (updated: ScheduleClean) => {
      setCleans((previous) =>
        previous.map((row) =>
          row.id === updated.id ? mapScheduleCleanToRow(updated, row) : row
        )
      );

      setManagedClean((current) =>
        current && current.clean.id === updated.id
          ? { ...current, clean: updated }
          : current
      );
    },
    [mapScheduleCleanToRow]
  );

  const scheduleRealtimeRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshCleans().finally(() => {
        refreshTimeoutRef.current = null;
      });
    }, 250);
  }, [refreshCleans]);

  useEffect(() => {
    if (!properties.length) return;

    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      console.warn("Supabase client unavailable for realtime updates.", error);
      return;
    }

    const propertyIds = properties
      .map((property) => property.id)
      .filter((id) => Boolean(id));

    if (!propertyIds.length) {
      return;
    }

    const filterValues = propertyIds.map((id) => `"${id}"`).join(",");
    const filter = `property_id=in.(${filterValues})`;
    const channelKey = propertyIds.slice(0, 5).join("-");

    const channel = supabase
      .channel(`cleans-dashboard-${channelKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cleans",
          filter,
        },
        () => {
          scheduleRealtimeRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [properties, scheduleRealtimeRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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
    setSyncMessage(null);
    setSyncMessageVisible(true);

    // Track cleans count before sync
    const cleansBeforeSync = cleans.length;

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const syncData = await response.json();

      // Calculate total cleans added across all properties
      let totalAdded = 0;
      if (syncData.results && Array.isArray(syncData.results)) {
        totalAdded = syncData.results.reduce(
          (sum: number, result: any) => sum + (result.bookingsAdded || 0),
          0
        );
      }

      setLastSynced(new Date());
      const fresh = await fetchCleansWithFilters(filters);
      setCleans(fresh);

      // Determine sync message with playful tone
      if (totalAdded === 0) {
        setSyncMessage("All caught up! 🎉 Everything is ready to go!");
      } else {
        const messages =
          totalAdded === 1
            ? [
                "Woohoo! 🎊 1 new clean is ready to go!",
                "Fresh new clean coming your way! ✨",
                "You've got 1 new cleaning scheduled! 🧹",
              ]
            : [
                `Awesome! 🚀 ${totalAdded} new cleans just arrived!`,
                `Wow! ${totalAdded} new cleans are ready to rock! 🎸`,
                `Fantastic! ${totalAdded} fresh cleans are in! 🎯`,
              ];
        // Pick a random playful message
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        setSyncMessage(randomMessage);
      }

      // Start fade out animation after 3 seconds
      setSyncMessageVisible(true);
      setTimeout(() => {
        setSyncMessageVisible(false);
        // Remove message after fade out completes
        setTimeout(() => {
          setSyncMessage(null);
        }, 300); // Fade duration
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync calendar.");
    } finally {
      setSyncing(false);
    }
  }, [filters, cleans.length]);

  return (
    <AppShell email={email}>
      <div className="space-y-6">
        <DashboardHeader />

        {/* Tab Views */}
        <div className="flex gap-2 border-b border-[#598392]/30">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-[#9AD1D4] text-[#9AD1D4]"
                : "text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
            }`}
          >
            All cleans
          </button>
          <button
            onClick={() => setActiveTab("self-managed")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "self-managed"
                ? "border-b-2 border-[#9AD1D4] text-[#9AD1D4]"
                : "text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
            }`}
          >
            Self-managed cleans
          </button>
          <button
            onClick={() => setActiveTab("company-managed")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "company-managed"
                ? "border-b-2 border-[#9AD1D4] text-[#9AD1D4]"
                : "text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
            }`}
          >
            Company-managed cleans
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2">
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

        {/* Sync Status */}
        {syncing && (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#598392]/40 bg-[#124559]/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#EFF6E0]/70">
                <span className="h-2 w-2 rounded-full bg-[#9AD1D4] animate-pulse" />
                Sync in progress
              </div>
              <p className="text-2xl font-semibold text-[#EFF6E0]">
                Fetching your latest cleans
              </p>
              <p className="max-w-xl text-sm text-[#EFF6E0]/70">
                We’re pulling fresh bookings across every calendar. Hang tight—
                your dashboard will refresh automatically.
              </p>
              <Loader />
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#EFF6E0]/50">
                CleanSync is updating
              </p>
            </div>
          </>
        )}

        {/* Sync Complete Message */}
        <AnimatePresence>
          {!syncing && syncMessage && syncMessageVisible && (
            <motion.div
              key="sync-complete"
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative mt-6 flex flex-col items-center gap-4 text-center">
                <button
                  onClick={() => {
                    setSyncMessageVisible(false);
                    setTimeout(() => {
                      setSyncMessage(null);
                    }, 250);
                  }}
                  className="absolute right-0 top-0 text-[#EFF6E0]/70 transition-transform duration-200 hover:scale-110 hover:text-[#EFF6E0]"
                  aria-label="Dismiss sync message"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#598392]/40 bg-[#124559]/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#EFF6E0]/70">
                  <span className="h-2 w-2 rounded-full bg-[#9AD1D4]" />
                  Sync complete
                </div>
                <p className="max-w-2xl text-lg font-semibold text-[#EFF6E0]">
                  {syncMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State / Table */}
        <motion.div layout="position">
          {loading && !syncing ? (
            <div className="flex items-center justify-center rounded-xl bg-[#124559] p-12 border border-[#124559]/50">
              <Loader />
            </div>
          ) : !syncing ? (
            <CleansTable
              cleans={filteredCleans}
              onDelete={async (id) => {
                const fresh = await fetchCleansWithFilters(filters);
                setCleans(fresh);
              }}
              onStatusUpdate={async () => {
                const fresh = await fetchCleansWithFilters(filters);
                setCleans(fresh);
              }}
              onManageClean={handleManageClean}
            />
          ) : null}
        </motion.div>
      </div>

      <CleanActionsModal
        open={Boolean(managedClean)}
        onClose={closeManagedClean}
        property={managedClean?.property ?? null}
        clean={managedClean?.clean ?? null}
        context={{ mode: "owner" }}
        onCleanUpdated={handleManagedCleanUpdated}
      />
    </AppShell>
  );
}
