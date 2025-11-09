"use client";

import { useState, useCallback, useMemo } from "react";
import { LogTable } from "./components/LogTable";
import type { LogRow } from "./components/LogTable";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function LogsClient({
  initialLogs,
  initialPagination,
}: {
  initialLogs: LogRow[];
  initialPagination: PaginationData;
}) {
  const [allLogs, setAllLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  // Default to 15 groups per page
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Group logs by their displayed time format (same minute) and sync type
  // Every log entry becomes a group, even if it's a group of 1
  const groupedLogs = useMemo(() => {
    const groups = allLogs.reduce((acc, log) => {
      const displayTime = formatDateTime(log.run_at);
      const syncType = log.sync_type;
      const groupKey = `${displayTime}|${syncType}`;
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(log);
      return acc;
    }, {} as Record<string, LogRow[]>);

    return Object.entries(groups).sort((a, b) => {
      const aTime = new Date(a[1][0].run_at).getTime();
      const bTime = new Date(b[1][0].run_at).getTime();
      return bTime - aTime;
    });
  }, [allLogs]);

  // Calculate pagination based on groups
  const totalGroups = groupedLogs.length;
  const totalPages = Math.ceil(totalGroups / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGroups = groupedLogs.slice(startIndex, endIndex);
  
  // Flatten only the logs from the paginated groups for the table
  // The table will re-group them, but since we've already paginated by groups,
  // it will only show the groups from the current page
  const paginatedLogs = useMemo(() => {
    // Only include logs from the groups on the current page
    return paginatedGroups.flatMap(([_, logs]) => logs);
  }, [paginatedGroups]);

  const pagination: PaginationData = {
    page: currentPage,
    limit: pageSize,
    total: totalGroups,
    totalPages,
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all logs (or a large batch) to group them properly
      const response = await fetch(`/api/logs?page=1&limit=1000`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setAllLogs(data.logs);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="space-y-4">
      {/* Pagination Controls */}
      {pagination.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-[#124559] p-4 border border-[#124559]/50">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#EFF6E0]/70">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              suppressHydrationWarning
              className="rounded-lg bg-[#124559]/60 px-3 py-1.5 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50 cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
            <span className="text-sm text-[#EFF6E0]/70">per page</span>
          </div>

          {/* Page Info */}
          <div className="text-sm text-[#EFF6E0]/70">
            Showing {startRecord}-{endRecord} of {pagination.total}
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="rounded-lg bg-[#124559]/60 px-3 py-1.5 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#124559]/80 transition-colors duration-200"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <span className="text-sm text-[#EFF6E0]/70">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="rounded-lg bg-[#124559]/60 px-3 py-1.5 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#124559]/80 transition-colors duration-200"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <LogTable logs={paginatedLogs} loading={loading} />
    </div>
  );
}
