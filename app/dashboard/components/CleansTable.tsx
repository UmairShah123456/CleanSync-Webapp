"use client";

import { formatDateTime } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { PencilIcon, EyeIcon } from "@heroicons/react/24/outline";

export type CleanRow = {
  id: string;
  property_name: string;
  scheduled_for: string;
  status: string;
  notes?: string | null;
  booking_uid: string;
  property_unit?: string;
  checkin?: string | null;
  checkout?: string | null;
};

export function CleansTable({ cleans }: { cleans: CleanRow[] }) {
  if (!cleans.length) {
    return (
      <div className="rounded-xl bg-[#124559] p-12 text-center border border-[#124559]/50 animate-fadeIn">
        <p className="text-sm text-[#EFF6E0]/70">
          No cleans found for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#124559] p-6 border border-[#124559]/50 animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#598392]/30">
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Property
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Clean Date
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Check-in / Check-out
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Notes
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Status
              </th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#598392]/20">
            {cleans.map((clean) => (
              <tr
                key={clean.id}
                className="transition-colors duration-200 hover:bg-[#124559]/50"
              >
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-[#EFF6E0]">
                      {clean.property_name}
                    </span>
                    {clean.property_unit && (
                      <span className="text-xs text-[#EFF6E0]/70 mt-0.5">
                        {clean.property_unit}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {formatDateTime(clean.scheduled_for)}
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  <div className="flex flex-col">
                    <span>
                      <span className="text-[#598392]">Check-in:</span>{" "}
                      {clean.checkin ? formatDateTime(clean.checkin) : "—"}
                    </span>
                    <span>
                      <span className="text-[#598392]">Check-out:</span>{" "}
                      {clean.checkout ? formatDateTime(clean.checkout) : "—"}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {isSameDayCheckIn(clean) ? (
                    <span className="mr-2 align-middle">
                      Same-day check-in.
                    </span>
                  ) : null}
                  {clean.notes ? (
                    <span className="align-middle">
                      {getDisplayNotes(clean.notes)}
                    </span>
                  ) : (
                    <span className="align-middle">—</span>
                  )}
                </td>
                <td className="py-4">
                  <StatusPill status={clean.status} />
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button className="text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isSameDayCheckIn(clean: {
  notes?: string | null;
  scheduled_for: string;
}) {
  // Heuristic detection based on notes keywords or flag markers
  const text = (clean.notes || "").toLowerCase();
  if (
    text.includes("same-day") ||
    text.includes("same day") ||
    text.includes("check-in") ||
    text.includes("check in")
  ) {
    return true;
  }
  // Also treat the warning emoji marker as a same-day indicator if present
  if ((clean.notes || "").includes("⚠️")) {
    return true;
  }
  return false;
}

function getDisplayNotes(notes?: string | null) {
  let t = notes || "";
  // Remove common alert/marker tokens to avoid duplicate visual indicators
  t = t.replaceAll("⚠️", "");
  t = t.replace(/\b(same[- ]day|check[- ]in)\b/gi, "");
  // Collapse extra whitespace and trim
  t = t.replace(/\s{2,}/g, " ").trim();
  return t || "";
}
