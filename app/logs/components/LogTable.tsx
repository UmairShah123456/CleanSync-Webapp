import React, { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export type LogRow = {
  id: string;
  property_name: string;
  run_at: string;
  bookings_added: number;
  bookings_removed: number;
  bookings_updated: number;
  sync_type: "manual" | "automatic";
};

export function LogTable({
  logs,
  loading,
}: {
  logs: LogRow[];
  loading?: boolean;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [collapsingGroups, setCollapsingGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    const isCurrentlyExpanded = expandedGroups.has(groupKey);
    
    if (isCurrentlyExpanded) {
      // Start collapse animation
      setCollapsingGroups((prev) => new Set(prev).add(groupKey));
      // Remove from expanded after animation completes
      setTimeout(() => {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.delete(groupKey);
          return next;
        });
        setCollapsingGroups((prev) => {
          const next = new Set(prev);
          next.delete(groupKey);
          return next;
        });
      }, 400); // Match animation duration
    } else {
      // Expand immediately
      setExpandedGroups((prev) => new Set(prev).add(groupKey));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-[#124559] p-12 border border-[#124559]/50 text-center">
        <p className="text-sm text-[#EFF6E0]/70">Loading logs...</p>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
        No sync activity yet. Trigger a sync to populate this list.
      </div>
    );
  }

  // Group logs by their displayed time format (same minute) and sync type
  // Note: These logs are already paginated, so we're just grouping what we received
  const groupedLogs = logs.reduce((groups, log) => {
    const displayTime = formatDateTime(log.run_at);
    const syncType = log.sync_type;
    // Group by both time and sync type so manual and automatic don't mix
    const groupKey = `${displayTime}|${syncType}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(log);
    return groups;
  }, {} as Record<string, LogRow[]>);

  const groupedEntries = Object.entries(groupedLogs).sort((a, b) => {
    // Sort by the first log's run_at timestamp (most recent first)
    const aTime = new Date(a[1][0].run_at).getTime();
    const bTime = new Date(b[1][0].run_at).getTime();
    return bTime - aTime;
  });

  return (
    <div className="rounded-xl bg-[#124559] p-6 border border-[#124559]/50 animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full md:table-fixed">
          <colgroup className="hidden md:table-column-group">
            <col className="w-[180px]" />
            <col className="w-[100px]" />
            <col className="w-[250px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[100px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#598392]/30">
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Run at
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Type
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Property
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Added
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Updated
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Cancelled
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#598392]/20">
            {groupedEntries.map(([groupKey, groupLogs]) => {
              const firstLog = groupLogs[0];
              const isGrouped = groupLogs.length > 1;
              const isExpanded = expandedGroups.has(groupKey);
              const isCollapsing = collapsingGroups.has(groupKey);

              // Calculate totals for the group
              const totalAdded = groupLogs.reduce(
                (sum, log) => sum + log.bookings_added,
                0
              );
              const totalUpdated = groupLogs.reduce(
                (sum, log) => sum + log.bookings_updated,
                0
              );
              const totalRemoved = groupLogs.reduce(
                (sum, log) => sum + log.bookings_removed,
                0
              );

              // If single property or group is collapsed (and not collapsing), show summary row
              if (!isGrouped || (!isExpanded && !isCollapsing)) {
                return (
                  <tr
                    key={groupKey}
                    className="transition-colors duration-200 hover:bg-[#124559]/50 cursor-pointer"
                    onClick={() => isGrouped && toggleGroup(groupKey)}
                  >
                    <td className="py-4 text-sm text-[#EFF6E0]/70">
                      {formatDateTime(firstLog.run_at)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          firstLog.sync_type === "automatic"
                            ? "bg-[#598392]/30 text-[#9AD1D4] border border-[#598392]/50"
                            : "bg-[#124559]/50 text-[#EFF6E0]/80 border border-[#124559]/70"
                        }`}
                      >
                        {firstLog.sync_type === "automatic" ? "Auto" : "Manual"}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-[#EFF6E0]/70">
                      <div className="flex items-center gap-2">
                        <span>
                          {isGrouped
                            ? `${groupLogs.length} properties`
                            : firstLog.property_name}
                        </span>
                        {isGrouped && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(groupKey);
                            }}
                            className="text-[#598392] hover:text-[#9AD1D4] transition-colors shrink-0"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4 transition-transform duration-200" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[#EFF6E0]/70">
                      {isGrouped ? totalAdded : firstLog.bookings_added}
                    </td>
                    <td className="py-4 text-sm text-[#EFF6E0]/70">
                      {isGrouped ? totalUpdated : firstLog.bookings_updated}
                    </td>
                    <td className="py-4 text-sm text-[#EFF6E0]/70">
                      {isGrouped ? totalRemoved : firstLog.bookings_removed}
                    </td>
                  </tr>
                );
              }

              // If group is expanded or collapsing, show all individual property rows
              return (
                <React.Fragment key={groupKey}>
                  {groupLogs.map((log, index) => {
                    const isExpanding = !isCollapsing;
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-[#124559]/50 ${
                          index > 0 ? "bg-[#124559]/30" : ""
                        }`}
                        style={{
                          ...(isExpanding && {
                            opacity: 0,
                            transform: "translateY(-20px)",
                          }),
                          animation: isCollapsing
                            ? `slideUp 0.4s ease-in ${index * 0.05}s forwards`
                            : `slideDown 0.4s ease-out ${index * 0.05}s forwards`,
                        }}
                      >
                      {index === 0 && (
                        <>
                          <td
                            className="py-4 text-sm text-[#EFF6E0]/70"
                            rowSpan={groupLogs.length}
                          >
                            {formatDateTime(log.run_at)}
                          </td>
                          <td
                            className="py-4"
                            rowSpan={groupLogs.length}
                          >
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                log.sync_type === "automatic"
                                  ? "bg-[#598392]/30 text-[#9AD1D4] border border-[#598392]/50"
                                  : "bg-[#124559]/50 text-[#EFF6E0]/80 border border-[#124559]/70"
                              }`}
                            >
                              {log.sync_type === "automatic"
                                ? "Auto"
                                : "Manual"}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-4 text-sm text-[#EFF6E0]/70">
                        <div className="flex items-center gap-2">
                          {log.property_name}
                          {index === 0 && (
                            <button
                              type="button"
                              onClick={() => toggleGroup(groupKey)}
                              className="text-[#598392] hover:text-[#9AD1D4] transition-colors shrink-0"
                              aria-label="Collapse"
                            >
                              <ChevronUpIcon className="h-4 w-4 transition-transform duration-200" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-[#EFF6E0]/70">
                        {log.bookings_added}
                      </td>
                      <td className="py-4 text-sm text-[#EFF6E0]/70">
                        {log.bookings_updated}
                      </td>
                      <td className="py-4 text-sm text-[#EFF6E0]/70">
                        {log.bookings_removed}
                      </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
