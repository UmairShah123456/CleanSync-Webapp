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
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  maintenance_notes?: string[] | null;
  reimbursements?: Array<{
    id: string;
    amount: number;
    item: string;
    created_at: string;
  }>;
};

export function CleansTable({
  cleans,
  onDelete,
  onStatusUpdate,
  onManageClean,
}: {
  cleans: CleanRow[];
  onDelete?: (id: string) => Promise<void>;
  onStatusUpdate?: () => Promise<void>;
  onManageClean?: (clean: CleanRow) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [timeValues, setTimeValues] = useState<Record<string, string>>({});
  const [removingNoteId, setRemovingNoteId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesEditValue, setNotesEditValue] = useState<string>("");
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [reimbursementsModalClean, setReimbursementsModalClean] = useState<CleanRow | null>(null);
  const [cleanerNotesModalClean, setCleanerNotesModalClean] = useState<CleanRow | null>(null);

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

  const handleRemoveNote = async (id: string, noteToRemove: string) => {
    setRemovingNoteId(id);
    try {
      // Get current clean to find its notes
      const currentClean = cleans.find((c) => c.id === id);
      if (!currentClean || !currentClean.notes) {
        return;
      }

      // Split notes by newlines and filter out the note to remove
      const notesArray = currentClean.notes
        .split(/\n/)
        .filter((note) => note.trim());
      const updatedNotes = notesArray
        .filter((note) => note.trim() !== noteToRemove.trim())
        .join("\n")
        .trim();

      const response = await fetch(`/api/cleans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: updatedNotes || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove note");
      }

      const payload = (await response.json()) as { clean?: any };
      if (payload.clean && onStatusUpdate) {
        // The API returns the updated clean, refresh to get the latest state
        await onStatusUpdate();
      } else if (onStatusUpdate) {
        await onStatusUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove note");
    } finally {
      setRemovingNoteId(null);
    }
  };

  const handleStartEditingNotes = (clean: CleanRow) => {
    setEditingNotesId(clean.id);
    setNotesEditValue(getDisplayNotes(clean.notes));
  };

  const handleCancelEditingNotes = () => {
    setEditingNotesId(null);
    setNotesEditValue("");
  };

  const handleSaveNotes = async (id: string) => {
    setSavingNotesId(id);
    try {
      const response = await fetch(`/api/cleans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesEditValue.trim() || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update notes");
      }

      const payload = (await response.json()) as { clean?: any };
      if (payload.clean && onStatusUpdate) {
        await onStatusUpdate();
      } else if (onStatusUpdate) {
        await onStatusUpdate();
      } else {
        window.location.reload();
      }

      setEditingNotesId(null);
      setNotesEditValue("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update notes");
    } finally {
      setSavingNotesId(null);
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
      className="rounded-xl bg-[#124559] border border-[#124559]/50 animate-fadeIn overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden md:block p-6 overflow-x-auto">
        <table className="w-full min-w-max">
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
                <th className="hidden py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Check-in / Check-out
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392] max-w-[200px]">
                  Host Notes
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Cleaner Notes
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Reimbursements
                </th>
                <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Status
                </th>
                <th className="py-3 text-right text-xs font-bold uppercase tracking-wider text-[#598392]">
                  Actions
                </th>
                {onManageClean ? (
                  <th className="py-3 text-right text-xs font-bold uppercase tracking-wider text-[#598392]">
                    Manage
                  </th>
                ) : null}
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
                  onManageClean={onManageClean}
                  handleRemoveNote={handleRemoveNote}
                  removingNoteId={removingNoteId}
                  editingNotesId={editingNotesId}
                  notesEditValue={notesEditValue}
                  setNotesEditValue={setNotesEditValue}
                  savingNotesId={savingNotesId}
                  handleStartEditingNotes={handleStartEditingNotes}
                  handleCancelEditingNotes={handleCancelEditingNotes}
                  handleSaveNotes={handleSaveNotes}
                  onViewReimbursements={setReimbursementsModalClean}
                  onViewCleanerNotes={setCleanerNotesModalClean}
                />
              ))}
            </tbody>
          </table>
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
              onManageClean={onManageClean}
              handleRemoveNote={handleRemoveNote}
              removingNoteId={removingNoteId}
              editingNotesId={editingNotesId}
              notesEditValue={notesEditValue}
              setNotesEditValue={setNotesEditValue}
              savingNotesId={savingNotesId}
              handleStartEditingNotes={handleStartEditingNotes}
              handleCancelEditingNotes={handleCancelEditingNotes}
              handleSaveNotes={handleSaveNotes}
              onViewReimbursements={setReimbursementsModalClean}
              onViewCleanerNotes={setCleanerNotesModalClean}
            />
            {/* Divider between cards */}
            {index < cleans.length - 1 && (
              <div className="h-px bg-[#598392]/30 mx-2 my-2" />
            )}
          </div>
        ))}
      </div>

      {/* Reimbursements Modal */}
      {reimbursementsModalClean && (
        <ReimbursementsModal
          clean={reimbursementsModalClean}
          onClose={() => setReimbursementsModalClean(null)}
        />
      )}

      {/* Cleaner Notes Modal */}
      {cleanerNotesModalClean && (
        <CleanerNotesModal
          clean={cleanerNotesModalClean}
          onClose={() => setCleanerNotesModalClean(null)}
        />
      )}
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
  onManageClean,
  handleRemoveNote,
  removingNoteId,
  editingNotesId,
  notesEditValue,
  setNotesEditValue,
  savingNotesId,
  handleStartEditingNotes,
  handleCancelEditingNotes,
  handleSaveNotes,
  onViewReimbursements,
  onViewCleanerNotes,
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
  onManageClean?: (clean: CleanRow) => void;
  handleRemoveNote: (id: string, note: string) => Promise<void>;
  removingNoteId: string | null;
  editingNotesId: string | null;
  notesEditValue: string;
  setNotesEditValue: React.Dispatch<React.SetStateAction<string>>;
  savingNotesId: string | null;
  handleStartEditingNotes: (clean: CleanRow) => void;
  handleCancelEditingNotes: () => void;
  handleSaveNotes: (id: string) => Promise<void>;
  onViewReimbursements: (clean: CleanRow) => void;
  onViewCleanerNotes: (clean: CleanRow) => void;
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
          "hidden py-4 text-sm",
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
          "py-4 text-sm max-w-[200px]",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        <div className="flex flex-col gap-1.5">
          {isSameDayCheckIn(clean) ? (
            <span className="align-middle">🔄 Same-day check-in</span>
          ) : null}
          {editingNotesId === clean.id ? (
            <div className="space-y-2">
              <textarea
                value={notesEditValue}
                onChange={(e) => setNotesEditValue(e.target.value)}
                className="w-full rounded-lg border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50 min-h-[80px] resize-y"
                placeholder="Enter notes here..."
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveNotes(clean.id)}
                  disabled={savingNotesId === clean.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-3 py-1 text-xs font-semibold text-[#EFF6E0] transition hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="h-4 w-4" />
                  {savingNotesId === clean.id ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditingNotes}
                  disabled={savingNotesId === clean.id}
                  className="inline-flex items-center gap-1 rounded-full border border-[#598392]/40 bg-[#01161E]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/70 transition hover:border-[#598392]/70 hover:text-[#EFF6E0] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="group/notes">
              {clean.notes && getDisplayNotes(clean.notes) ? (
                <div className="text-sm whitespace-pre-wrap">
                  {getDisplayNotes(clean.notes)}
                </div>
              ) : !isSameDayCheckIn(clean) ? (
                <span className="text-sm text-[#EFF6E0]/40">—</span>
              ) : null}
              <button
                type="button"
                onClick={() => handleStartEditingNotes(clean)}
                className="mt-1 inline-flex items-center gap-1 text-xs text-[#598392] opacity-0 transition-opacity group-hover/notes:opacity-100 hover:text-[#598392]/80"
              >
                <PencilSquareIcon className="h-3 w-3" />
                {clean.notes && getDisplayNotes(clean.notes) ? "Edit" : "Add note"}
              </button>
            </div>
          )}
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
        {clean.maintenance_notes && clean.maintenance_notes.length > 0 ? (
          <button
            onClick={() => onViewCleanerNotes(clean)}
            className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
          >
            <span>{clean.maintenance_notes.length}</span>
            <span>{clean.maintenance_notes.length === 1 ? 'note' : 'notes'}</span>
          </button>
        ) : (
          <span className="text-sm text-[#EFF6E0]/40">—</span>
        )}
      </td>
      <td
        className={clsx(
          "py-4",
          isCancelled
            ? "text-[#EFF6E0]/50"
            : isCompleted
            ? "text-[#EFF6E0]/60"
            : "text-[#EFF6E0]/70"
        )}
      >
        {clean.reimbursements && clean.reimbursements.length > 0 ? (
          <button
            onClick={() => onViewReimbursements(clean)}
            className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
          >
            <span>{clean.reimbursements.length}</span>
            <span>{clean.reimbursements.length === 1 ? 'item' : 'items'}</span>
          </button>
        ) : (
          <span className="text-sm text-[#EFF6E0]/40">—</span>
        )}
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
      {onManageClean ? (
        <td className="py-4 text-right">
          <button
            type="button"
            onClick={() => onManageClean(clean)}
            className="inline-flex items-center rounded-full border border-[#598392]/40 bg-[#01161E]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80 transition hover:border-[#598392]/70 hover:text-[#EFF6E0]"
          >
            Manage
          </button>
        </td>
      ) : null}
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
  onManageClean,
  handleRemoveNote,
  removingNoteId,
  editingNotesId,
  notesEditValue,
  setNotesEditValue,
  savingNotesId,
  handleStartEditingNotes,
  handleCancelEditingNotes,
  handleSaveNotes,
  onViewReimbursements,
  onViewCleanerNotes,
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
  onManageClean?: (clean: CleanRow) => void;
  handleRemoveNote: (id: string, note: string) => Promise<void>;
  removingNoteId: string | null;
  editingNotesId: string | null;
  notesEditValue: string;
  setNotesEditValue: React.Dispatch<React.SetStateAction<string>>;
  savingNotesId: string | null;
  handleStartEditingNotes: (clean: CleanRow) => void;
  handleCancelEditingNotes: () => void;
  handleSaveNotes: (id: string) => Promise<void>;
  onViewReimbursements: (clean: CleanRow) => void;
  onViewCleanerNotes: (clean: CleanRow) => void;
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
      <div className="flex items-start gap-1.5 mt-1.5">
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
              "text-sm font-semibold flex-1 flex flex-col gap-1",
              isCancelled
                ? "text-[#EFF6E0]/50"
                : isCompleted
                ? "text-[#EFF6E0]/60"
                : "text-[#EFF6E0]"
            )}
          >
            {isSameDayCheckIn(clean) && (
              <span className="mr-2 text-xs">🔄 Same-day check-in</span>
            )}
            {editingNotesId === clean.id ? (
              <div className="space-y-2">
                <textarea
                  value={notesEditValue}
                  onChange={(e) => setNotesEditValue(e.target.value)}
                  className="w-full rounded-lg border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50 min-h-[80px] resize-y"
                  placeholder="Enter notes here..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(clean.id)}
                    disabled={savingNotesId === clean.id}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-3 py-1 text-xs font-semibold text-[#EFF6E0] transition hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {savingNotesId === clean.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditingNotes}
                    disabled={savingNotesId === clean.id}
                    className="inline-flex items-center gap-1 rounded-full border border-[#598392]/40 bg-[#01161E]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/70 transition hover:border-[#598392]/70 hover:text-[#EFF6E0] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group/notes-mobile">
                {clean.notes && getDisplayNotes(clean.notes) ? (
                  <div className="text-sm whitespace-pre-wrap">
                    {getDisplayNotes(clean.notes)}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleStartEditingNotes(clean)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[#598392] transition-opacity hover:text-[#598392]/80"
                >
                  <PencilSquareIcon className="h-3 w-3" />
                  {clean.notes && getDisplayNotes(clean.notes) ? "Edit" : "Add note"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cleaner Notes */}
        {clean.maintenance_notes && clean.maintenance_notes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#598392]/20">
            <p className="text-xs text-[#EFF6E0]/50 mb-1">Cleaner Notes:</p>
            <button
              onClick={() => onViewCleanerNotes(clean)}
              className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
            >
              <span>{clean.maintenance_notes.length}</span>
              <span>{clean.maintenance_notes.length === 1 ? 'note' : 'notes'}</span>
            </button>
          </div>
        )}

        {/* Reimbursements */}
        {clean.reimbursements && clean.reimbursements.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#598392]/20">
            <p className="text-xs text-[#EFF6E0]/50 mb-1">Reimbursements:</p>
            <button
              onClick={() => onViewReimbursements(clean)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <span>{clean.reimbursements.length}</span>
              <span>{clean.reimbursements.length === 1 ? 'item' : 'items'}</span>
            </button>
          </div>
        )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => handleDelete(clean.id)}
          className={clsx(
            "inline-flex items-center justify-center gap-1 rounded-full border border-red-400/40 bg-[#01161E]/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100",
            (isCancelled || deletingId === clean.id) &&
              "cursor-not-allowed opacity-60"
          )}
          disabled={isCancelled || deletingId === clean.id}
        >
          <TrashIcon className="h-4 w-4" /> Delete
        </button>
        {onManageClean ? (
          <button
            type="button"
            onClick={() => onManageClean(clean)}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-[#598392]/40 bg-[#01161E]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80 transition hover:border-[#598392]/70 hover:text-[#EFF6E0]"
          >
            Manage
          </button>
        ) : null}
      </div>
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

function ReimbursementsModal({
  clean,
  onClose,
}: {
  clean: CleanRow;
  onClose: () => void;
}) {
  const totalAmount = clean.reimbursements?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" style={{ position: 'fixed' }}>
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-[#124559]/60 bg-[#01161E] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#124559]/40 bg-[#01161E] px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#EFF6E0]">
                Reimbursements
              </h2>
              <p className="mt-1 text-sm text-[#EFF6E0]/60">
                {clean.property_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#EFF6E0]/60 transition hover:bg-[#124559]/40 hover:text-[#EFF6E0]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {clean.reimbursements && clean.reimbursements.length > 0 ? (
            <>
              {clean.reimbursements.map((reimbursement) => (
                <div
                  key={reimbursement.id}
                  className="rounded-xl border border-[#124559]/40 bg-[#01161E]/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-[#EFF6E0]">
                        {reimbursement.item}
                      </p>
                      <p className="mt-1 text-xs text-[#EFF6E0]/50">
                        {new Date(reimbursement.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-semibold text-[#EFF6E0]">
                        £{reimbursement.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="mt-4 rounded-xl border border-[#598392]/40 bg-[#124559]/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#598392]">
                    Total
                  </p>
                  <p className="text-xl font-bold text-[#EFF6E0]">
                    £{totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-[#EFF6E0]/50 py-8">
              No reimbursements logged
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[#124559]/40 bg-[#01161E] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-semibold text-[#EFF6E0] transition hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function CleanerNotesModal({
  clean,
  onClose,
}: {
  clean: CleanRow;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" style={{ position: 'fixed' }}>
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-[#124559]/60 bg-[#01161E] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#124559]/40 bg-[#01161E] px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#EFF6E0]">
                Cleaner Notes
              </h2>
              <p className="mt-1 text-sm text-[#EFF6E0]/60">
                {clean.property_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#EFF6E0]/60 transition hover:bg-[#124559]/40 hover:text-[#EFF6E0]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {clean.maintenance_notes && clean.maintenance_notes.length > 0 ? (
            <>
              {clean.maintenance_notes.map((note, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#124559]/40 bg-[#01161E]/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/30">
                        <span className="text-xs font-semibold text-orange-300">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#EFF6E0] whitespace-pre-wrap">
                        {note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-center text-sm text-[#EFF6E0]/50 py-8">
              No cleaner notes logged
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[#124559]/40 bg-[#01161E] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-semibold text-[#EFF6E0] transition hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
