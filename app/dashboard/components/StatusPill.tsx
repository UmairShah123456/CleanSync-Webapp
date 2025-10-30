"use client";

import clsx from "clsx";

export function StatusPill({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-[#AEC3B0] text-[#01161E]";
      case "completed":
        return "border border-[#EFF6E0] text-[#EFF6E0] bg-transparent";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "border border-[#EFF6E0] text-[#EFF6E0] bg-transparent";
    }
  };

  const getStatusLabel = () => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "Scheduled";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        getStatusStyle()
      )}
    >
      {getStatusLabel()}
    </span>
  );
}
