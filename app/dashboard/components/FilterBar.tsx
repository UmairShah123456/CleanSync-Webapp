"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { ChevronDownIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import type { FilterState } from "@/components/forms/FilterForm";

export function FilterBar({
  properties,
  onFilterChange,
  onSync,
  syncing,
  lastSynced,
}: {
  properties: { id: string; name: string }[];
  onFilterChange: (filters: FilterState) => void;
  onSync: () => Promise<void>;
  syncing: boolean;
  lastSynced?: Date | null;
}) {
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const updateFilters = (updater: (prev: FilterState) => FilterState) => {
    setFilters((prev) => {
      const next = updater(prev);
      return next;
    });
  };

  const handleReset = () => {
    setFilters({});
    setDateRange("");
  };

  // Propagate filter changes to parent AFTER render commit to avoid setState during render
  useEffect(() => {
    onFilterChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const getLastSyncedText = () => {
    if (!lastSynced) return "Never synced";
    const diff = Date.now() - new Date(lastSynced).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} min ago`;
  };

  return (
    <div className="animate-fadeIn">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex items-center gap-3 rounded-xl bg-[#124559]/20 backdrop-blur-sm p-4 border border-[#124559]/30">
        {/* Property Dropdown */}
        <div className="relative flex-1">
          <select
            suppressHydrationWarning
            value={filters.propertyId ?? ""}
            onChange={(e) =>
              updateFilters((prev) => ({
                ...prev,
                propertyId: e.target.value || undefined,
              }))
            }
            className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
        </div>

        {/* Date Range Dropdown */}
        <div className="relative flex-1">
          <select
            suppressHydrationWarning
            value={dateRange}
            onChange={(e) => {
              const val = e.target.value;
              setDateRange(val);
              if (!val) {
                updateFilters((prev) => ({
                  ...prev,
                  from: undefined,
                  to: undefined,
                }));
                return;
              }
              const now = new Date();
              let from: string | undefined;
              let to: string | undefined;
              if (val === "today") {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                const end = new Date(now);
                end.setHours(23, 59, 59, 999);
                from = start.toISOString();
                to = end.toISOString();
              } else if (val === "week") {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(start.getDate() + 7);
                end.setHours(23, 59, 59, 999);
                from = start.toISOString();
                to = end.toISOString();
              } else if (val === "month") {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(
                  now.getFullYear(),
                  now.getMonth() + 1,
                  0,
                  23,
                  59,
                  59,
                  999
                );
                from = start.toISOString();
                to = end.toISOString();
              }
              updateFilters((prev) => ({ ...prev, from, to }));
            }}
            className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
        </div>

        {/* Job Status Dropdown */}
        <div className="relative flex-1">
          <select
            suppressHydrationWarning
            value={filters.status ?? ""}
            onChange={(e) =>
              updateFilters((prev) => ({
                ...prev,
                status: e.target.value || undefined,
              }))
            }
            className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200"
        >
          Clear filters
        </button>

        {/* Sync Button */}
        <div className="flex flex-col items-end">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-medium text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
          >
            <ArrowPathIcon
              className={clsx("h-4 w-4", syncing && "animate-spin")}
            />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          {lastSynced && (
            <p className="mt-1 text-xs text-[#EFF6E0]/50">
              Last synced {getLastSyncedText()}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full bg-[#124559]/40 px-4 py-2 text-sm font-medium text-[#EFF6E0] border border-[#124559]/50"
          >
            Filter
          </button>
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-medium text-[#EFF6E0]"
          >
            <ArrowPathIcon
              className={clsx("h-4 w-4", syncing && "animate-spin")}
            />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>

        {/* Mobile Filter Panel */}
        {showFilters && (
          <div className="rounded-xl bg-[#124559]/20 backdrop-blur-sm p-4 border border-[#124559]/30 space-y-3">
            {/* Property Dropdown */}
            <div className="relative">
              <select
                suppressHydrationWarning
                value={filters.propertyId ?? ""}
                onChange={(e) =>
                  updateFilters((prev) => ({
                    ...prev,
                    propertyId: e.target.value || undefined,
                  }))
                }
                className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
            </div>

            {/* Date Range Dropdown */}
            <div className="relative">
              <select
                suppressHydrationWarning
                value={dateRange}
                onChange={(e) => {
                  const val = e.target.value;
                  setDateRange(val);
                  if (!val) {
                    updateFilters((prev) => ({
                      ...prev,
                      from: undefined,
                      to: undefined,
                    }));
                    return;
                  }
                  const now = new Date();
                  let from: string | undefined;
                  let to: string | undefined;
                  if (val === "today") {
                    const start = new Date(now);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(now);
                    end.setHours(23, 59, 59, 999);
                    from = start.toISOString();
                    to = end.toISOString();
                  } else if (val === "week") {
                    const start = new Date(now);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 7);
                    end.setHours(23, 59, 59, 999);
                    from = start.toISOString();
                    to = end.toISOString();
                  } else if (val === "month") {
                    const start = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      1
                    );
                    const end = new Date(
                      now.getFullYear(),
                      now.getMonth() + 1,
                      0,
                      23,
                      59,
                      59,
                      999
                    );
                    from = start.toISOString();
                    to = end.toISOString();
                  }
                  updateFilters((prev) => ({ ...prev, from, to }));
                }}
                className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
            </div>

            {/* Job Status Dropdown */}
            <div className="relative">
              <select
                suppressHydrationWarning
                value={filters.status ?? ""}
                onChange={(e) =>
                  updateFilters((prev) => ({
                    ...prev,
                    status: e.target.value || undefined,
                  }))
                }
                className="w-full appearance-none rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/70" />
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200 text-center"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
