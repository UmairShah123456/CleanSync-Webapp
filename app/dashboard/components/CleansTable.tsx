"use client";

import { formatDateTime } from "@/lib/utils";
import {
  TrashIcon,
  ChevronDownIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";

export type CleanRow = {
  id: string;
  property_id: string;
  property_name: string;
  scheduled_for: string;
  status: string;
  notes?: string | null;
  booking_uid: string;
  property_unit?: string;
  checkin?: string | null;
  checkout?: string | null;
  cleaner?: string | null;
};

export function CleansTable({
  cleans,
  onDelete,
  onStatusUpdate,
}: {
  cleans: CleanRow[];
  onDelete?: (id: string) => Promise<void>;
  onStatusUpdate?: () => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [timeValues, setTimeValues] = useState<Record<string, string>>({});

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this clean? It will not reappear on the next sync."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/cleans/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete clean");
      }

      // Refresh the page to update the cleans list
      if (onDelete) {
        await onDelete(id);
      } else {
        window.location.reload();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete clean");
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const response = await fetch(`/api/cleans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      // Reset updating state before refreshing
      setUpdatingStatusId(null);

      // Refresh the cleans list
      if (onStatusUpdate) {
        await onStatusUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update status");
      setUpdatingStatusId(null);
    }
  };

  const handleTimeChange = async (id: string, timeString: string) => {
    setEditingTimeId(id);
    try {
      // Get the current scheduled_for date
      const clean = cleans.find((c) => c.id === id);
      if (!clean) {
        throw new Error("Clean not found");
      }

      const currentDate = new Date(clean.scheduled_for);
      const [hours, minutes] = timeString.split(":").map(Number);

      // Set the time to the selected hours and minutes, keeping the same date
      currentDate.setHours(hours, minutes || 0, 0, 0);

      const response = await fetch(`/api/cleans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduled_for: currentDate.toISOString() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update time");
      }

      // Reset editing state before refreshing
      setEditingTimeId(null);

      // Refresh the cleans list
      if (onStatusUpdate) {
        await onStatusUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update time");
      setEditingTimeId(null);
    }
  };

  const formatDateOnly = (value: string | Date): string => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  const getDefaultTime = (scheduledFor: string): string => {
    const date = new Date(scheduledFor);
    // Default to 10:00 AM if time is midnight
    if (date.getHours() === 0 && date.getMinutes() === 0) {
      return "10:00";
    }
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

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
    <div
      className="rounded-xl bg-[#124559] border border-[#124559]/50 animate-fadeIn"
      style={{ overflow: "visible" }}
    >
      {/* Desktop Table View */}
      <div className="hidden md:block p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#598392]/30">
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Property
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Clean Date
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Checkout Time
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Cleaner
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Check-in / Check-out
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Notes
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Status
                </th>
                <th className="py-3 text-right text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#598392]/20">
              {cleans.map((clean) => (
                <DesktopTableRow
                  key={clean.id}
                  clean={clean}
                  deletingId={deletingId}
                  updatingStatusId={updatingStatusId}
                  editingTimeId={editingTimeId}
                  timeValues={timeValues}
                  setTimeValues={setTimeValues}
                  handleDelete={handleDelete}
                  handleStatusChange={handleStatusChange}
                  handleTimeChange={handleTimeChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-3" style={{ overflow: "visible" }}>
        {cleans.map((clean, index) => (
          <div key={clean.id}>
            <MobileCard
              clean={clean}
              deletingId={deletingId}
              updatingStatusId={updatingStatusId}
              editingTimeId={editingTimeId}
              timeValues={timeValues}
              setTimeValues={setTimeValues}
              handleDelete={handleDelete}
              handleStatusChange={handleStatusChange}
              handleTimeChange={handleTimeChange}
            />
            {/* Divider between cards */}
            {index < cleans.length - 1 && (
              <div className="h-px bg-[#598392]/30 mx-2 my-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopTableRow({
  clean,
  deletingId,
  updatingStatusId,
  editingTimeId,
  timeValues,
  setTimeValues,
  handleDelete,
  handleStatusChange,
  handleTimeChange,
}: {
  clean: CleanRow;
  deletingId: string | null;
  updatingStatusId: string | null;
  editingTimeId: string | null;
  timeValues: Record<string, string>;
  setTimeValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleDelete: (id: string) => Promise<void>;
  handleStatusChange: (id: string, status: string) => Promise<void>;
  handleTimeChange: (id: string, time: string) => Promise<void>;
}) {
  const status = clean.status.toLowerCase();
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";

  const formatDateOnly = (value: string | Date): string => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  const getDefaultTime = (scheduledFor: string): string => {
    const date = new Date(scheduledFor);
    if (date.getHours() === 0 && date.getMinutes() === 0) {
      return "10:00";
    }
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <tr
      className={clsx(
        "transition-colors duration-200",
        isCancelled
          ? "bg-[#2a1f2e]/30 opacity-75 hover:bg-[#2a1f2e]/40"
          : isCompleted
          ? "bg-[#1a2530]/40 opacity-80 hover:bg-[#1a2530]/50"
          : "hover:bg-[#124559]/50"
      )}
    >
      <td className="py-4">
        <div className="flex flex-col">
          <span
            className={clsx(
              "font-medium",
              isCancelled
                ? "text-[#EFF6E0]/50 line-through"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]"
            )}
          >
            {clean.property_name}
          </span>
          {clean.property_unit && (
            <span
              className={clsx(
                "text-xs mt-0.5",
                isCancelled
                  ? "text-[#EFF6E0]/40 line-through"
                  : isCompleted
                  ? "text-[#EFF6E0]/50"
                  : "text-[#EFF6E0]/70"
              )}
            >
              {clean.property_unit}
            </span>
          )}
        </div>
      </td>
      <td
        className={clsx(
          "py-4 text-sm font-bold",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        {formatDateOnly(clean.scheduled_for)}
      </td>
      <td className="py-4">
        <input
          type="time"
          defaultValue={getDefaultTime(clean.scheduled_for)}
          suppressHydrationWarning
          onChange={(e) => {
            const timeValue = e.target.value;
            setTimeValues((prev) => ({
              ...prev,
              [clean.id]: timeValue,
            }));
            handleTimeChange(clean.id, timeValue);
          }}
          disabled={editingTimeId === clean.id || isCancelled}
          className={clsx(
            "w-full max-w-[120px] rounded-lg bg-[#124559]/60 px-3 py-1.5 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50",
            "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert",
            editingTimeId === clean.id && "opacity-50 cursor-wait",
            isCancelled && "opacity-30 cursor-not-allowed"
          )}
          title="Checkout time (defaults to 10:00 AM)"
        />
      </td>
      <td
        className={clsx(
          "py-4 text-sm",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        {clean.cleaner || "—"}
      </td>
      <td
        className={clsx(
          "py-4 text-sm",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        <div className="flex flex-col">
          <span>
            <span
              className={clsx(
                isCancelled
                  ? "text-[#598392]/50"
                  : isCompleted
                  ? "text-[#598392]/60"
                  : "text-[#598392]"
              )}
            >
              Check-in:
            </span>{" "}
            {clean.checkin ? formatDateTime(clean.checkin) : "—"}
          </span>
          <span>
            <span
              className={clsx(
                isCancelled
                  ? "text-[#598392]/50"
                  : isCompleted
                  ? "text-[#598392]/60"
                  : "text-[#598392]"
              )}
            >
              Check-out:
            </span>{" "}
            {clean.checkout ? formatDateTime(clean.checkout) : "—"}
          </span>
        </div>
      </td>
      <td
        className={clsx(
          "py-4 text-sm",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        {isSameDayCheckIn(clean) ? (
          <span className="mr-2 align-middle">🔄 Same-day check-in</span>
        ) : null}
        {clean.notes && getDisplayNotes(clean.notes) ? (
          <span className="align-middle">{getDisplayNotes(clean.notes)}</span>
        ) : !isSameDayCheckIn(clean) ? (
          <span className="align-middle">—</span>
        ) : null}
      </td>
      <td className="py-4 relative z-10">
        <select
          value={clean.status}
          onChange={(e) => handleStatusChange(clean.id, e.target.value)}
          disabled={updatingStatusId === clean.id}
          suppressHydrationWarning
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium border-0 outline-none transition-colors duration-200",
            updatingStatusId === clean.id
              ? "cursor-wait opacity-50"
              : "cursor-pointer",
            "focus:ring-2 focus:ring-[#598392] focus:ring-offset-2 focus:ring-offset-[#124559]",
            "hover:opacity-90"
          )}
          style={{
            backgroundColor:
              status === "scheduled"
                ? "#AEC3B0"
                : status === "completed"
                ? "transparent"
                : status === "cancelled"
                ? "#ef4444"
                : "#124559",
            color:
              status === "scheduled"
                ? "#01161E"
                : status === "completed"
                ? "#EFF6E0"
                : status === "cancelled"
                ? "white"
                : "#EFF6E0",
            border: status === "completed" ? "1px solid #EFF6E0" : "none",
            pointerEvents: updatingStatusId === clean.id ? "none" : "auto",
          }}
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
      <td className="py-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => handleDelete(clean.id)}
            className={clsx(
              "transition-colors duration-200",
              isCancelled || deletingId === clean.id
                ? "cursor-not-allowed"
                : "cursor-pointer"
            )}
            disabled={isCancelled || deletingId === clean.id}
            title="Delete clean"
          >
            <TrashIcon
              className={clsx(
                "h-5 w-5",
                isCancelled || deletingId === clean.id
                  ? "text-[#EFF6E0]/30"
                  : "text-[#EFF6E0]"
              )}
            />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileCard({
  clean,
  deletingId,
  updatingStatusId,
  editingTimeId,
  timeValues,
  setTimeValues,
  handleDelete,
  handleStatusChange,
  handleTimeChange,
}: {
  clean: CleanRow;
  deletingId: string | null;
  updatingStatusId: string | null;
  editingTimeId: string | null;
  timeValues: Record<string, string>;
  setTimeValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleDelete: (id: string) => Promise<void>;
  handleStatusChange: (id: string, status: string) => Promise<void>;
  handleTimeChange: (id: string, time: string) => Promise<void>;
}) {
  const status = clean.status.toLowerCase();
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";

  const formatDateOnly = (value: string | Date): string => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  const getDefaultTime = (scheduledFor: string): string => {
    const date = new Date(scheduledFor);
    if (date.getHours() === 0 && date.getMinutes() === 0) {
      return "10:00";
    }
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={clsx(
        "rounded-lg p-2 border-2 transition-colors duration-200 relative mb-4",
        isCancelled
          ? "bg-[#2a1f2e]/30 border-[#2a1f2e]/60 opacity-75"
          : isCompleted
          ? "bg-[#1a2530]/40 border-[#1a2530]/60 opacity-80"
          : "bg-[#124559]/30 border-[#124559]/60"
      )}
      style={{ overflow: "visible" }}
    >
      {/* Top Row: Property Name, Clean Date, Status Dropdown */}
      <div className="flex items-start justify-between">
        {/* Left: Property Name and Clean Date */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <MapPinIcon
              className={clsx(
                "h-4 w-4 shrink-0",
                isCancelled
                  ? "text-[#EFF6E0]/50"
                  : isCompleted
                  ? "text-[#EFF6E0]/60"
                  : "text-[#EFF6E0]/80"
              )}
            />
            <div
              className={clsx(
                "font-semibold text-sm",
                isCancelled
                  ? "text-[#EFF6E0]/50 line-through"
                  : isCompleted
                  ? "text-[#EFF6E0]/60"
                  : "text-[#EFF6E0]"
              )}
            >
              {clean.property_name}
            </div>
          </div>
          {clean.property_unit && (
            <div
              className={clsx(
                "text-xs mt-0.5 ml-6",
                isCancelled
                  ? "text-[#EFF6E0]/40 line-through"
                  : isCompleted
                  ? "text-[#EFF6E0]/50"
                  : "text-[#EFF6E0]/70"
              )}
            >
              {clean.property_unit}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <CalendarIcon
              className={clsx(
                "h-4 w-4 shrink-0",
                isCancelled
                  ? "text-[#EFF6E0]/50"
                  : isCompleted
                  ? "text-[#EFF6E0]/60"
                  : "text-[#EFF6E0]/80"
              )}
            />
            <div
              className={clsx(
                "font-semibold text-sm",
                isCancelled
                  ? "text-[#EFF6E0]/50"
                  : isCompleted
                  ? "text-[#EFF6E0]/60"
                  : "text-[#EFF6E0]"
              )}
            >
              {formatDateOnly(clean.scheduled_for)}
            </div>
          </div>
        </div>
        {/* Right: Status Dropdown */}
        <div className="shrink-0">
          <div className="relative z-10">
            <select
              value={clean.status}
              onChange={(e) => handleStatusChange(clean.id, e.target.value)}
              disabled={updatingStatusId === clean.id}
              suppressHydrationWarning
              className={clsx(
                "rounded-full pl-2.5 pr-7 py-1.5 text-xs font-medium border-0 outline-none transition-colors duration-200 appearance-none",
                updatingStatusId === clean.id
                  ? "cursor-wait opacity-50"
                  : "cursor-pointer",
                "focus:ring-2 focus:ring-[#598392]"
              )}
              style={{
                backgroundColor:
                  status === "scheduled"
                    ? "#AEC3B0"
                    : status === "completed"
                    ? "transparent"
                    : status === "cancelled"
                    ? "#ef4444"
                    : "#124559",
                color:
                  status === "scheduled"
                    ? "#01161E"
                    : status === "completed"
                    ? "#EFF6E0"
                    : status === "cancelled"
                    ? "white"
                    : "#EFF6E0",
                border: status === "completed" ? "1px solid #EFF6E0" : "none",
                pointerEvents: updatingStatusId === clean.id ? "none" : "auto",
                minWidth: "90px",
                maxWidth: "110px",
              }}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current opacity-70" />
          </div>
        </div>
      </div>

      {/* Checkout Time Input - Below Top Row */}
      <div className="mt-1.5">
        <div className="flex items-center gap-1.5">
          <ClockIcon
            className={clsx(
              "h-4 w-4 shrink-0",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]/80"
            )}
          />
          <div className="relative flex-1">
            <input
              type="time"
              defaultValue={getDefaultTime(clean.scheduled_for)}
              suppressHydrationWarning
              onChange={(e) => {
                const timeValue = e.target.value;
                setTimeValues((prev) => ({
                  ...prev,
                  [clean.id]: timeValue,
                }));
                handleTimeChange(clean.id, timeValue);
              }}
              disabled={editingTimeId === clean.id || isCancelled}
              className={clsx(
                "w-full rounded-lg text-sm font-semibold text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] text-left",
                "[&::-webkit-calendar-picker-indicator]:hidden",
                isCancelled
                  ? "bg-[#2a1f2e]/40 border border-[#2a1f2e]/60 opacity-30"
                  : isCompleted
                  ? "bg-[#1a2530]/40 border-[#1a2530]/60 opacity-80"
                  : "bg-[#124559]/70 border border-[#124559]/70",
                editingTimeId === clean.id && "opacity-50 cursor-wait",
                isCancelled && "cursor-not-allowed"
              )}
              title="Checkout time"
              style={{
                textAlign: "left",
              }}
            />
          </div>
        </div>
      </div>

      {/* Cleaner - Below Checkout Time */}
      {clean.cleaner && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <UserIcon
            className={clsx(
              "h-4 w-4 shrink-0",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]/80"
            )}
          />
          <div
            className={clsx(
              "font-semibold text-sm",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]"
            )}
          >
            {clean.cleaner}
          </div>
        </div>
      )}

      {/* Notes */}
      {(isSameDayCheckIn(clean) ||
        (clean.notes && getDisplayNotes(clean.notes))) && (
        <div className="flex items-end gap-1.5 mt-1.5">
          <DocumentTextIcon
            className={clsx(
              "h-4 w-4 shrink-0 mt-0.5",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]/80"
            )}
          />
          <div
            className={clsx(
              "text-sm font-semibold flex-1",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]"
            )}
          >
            {isSameDayCheckIn(clean) && (
              <span className="mr-2">Same-day check-in</span>
            )}
            {clean.notes && getDisplayNotes(clean.notes) && (
              <span>{getDisplayNotes(clean.notes)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isSameDayCheckIn(clean: {
  notes?: string | null;
  scheduled_for: string;
}) {
  const text = (clean.notes || "").toLowerCase();
  if (
    text.includes("same-day") ||
    text.includes("same day") ||
    text.includes("check-in") ||
    text.includes("check in")
  ) {
    return true;
  }
  if ((clean.notes || "").includes("⚠️")) {
    return true;
  }
  return false;
}

function getDisplayNotes(notes?: string | null) {
  let t = notes || "";
  t = t.replace(/⚠️\s*Same-day check-in\.?/gi, "");
  t = t.replace(/⚠️\s*Same day check-in\.?/gi, "");
  t = t.replace(/\bSame-day check-in\.?/gi, "");
  t = t.replace(/\bSame day check-in\.?/gi, "");
  t = t.replaceAll("⚠️", "");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t || "";
}
