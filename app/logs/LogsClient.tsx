"use client";

import { useState, useEffect, useCallback } from "react";
import { LogTable } from "./components/LogTable";
import type { LogRow } from "./components/LogTable";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(pagination.limit);

  const fetchLogs = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?page=${page}&limit=${limit}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchLogs(1, newSize);
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
      <LogTable logs={logs} loading={loading} />
    </div>
  );
}
