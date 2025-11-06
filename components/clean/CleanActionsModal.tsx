"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import type { ScheduleClean, ScheduleProperty } from "@/app/schedule/types";

type CleanerContext = {
  mode: "cleaner";
  cleanerType: "individual" | "company";
  token: string | null;
};

type OwnerContext = {
  mode: "owner";
};

export type CleanActionsContext = CleanerContext | OwnerContext;

const CLEAN_STATUS_OPTIONS = [
  {
    value: "scheduled" as const,
    label: "Scheduled",
    description: "Use while the clean is pending or in progress.",
  },
  {
    value: "completed" as const,
    label: "Completed",
    description: "Confirm once the clean is finished and walkthrough is done.",
  },
  {
    value: "cancelled" as const,
    label: "Cancelled",
    description: "Only use if the clean is no longer going ahead.",
  },
];

const MAINTENANCE_NOTE_OPTIONS = [
  "Restocked toiletries and consumables",
  "Left fresh linens and towels ready for guests",
  "Flagged wear and tear that needs attention",
  "Replenished on-site cleaning supplies",
  "Captured photos for reported damage",
];

const STATUS_VALUE_SET = new Set(
  CLEAN_STATUS_OPTIONS.map((option) => option.value)
);

const normalizeStatusValue = (
  value: string
): "scheduled" | "completed" | "cancelled" => {
  return STATUS_VALUE_SET.has(value as any)
    ? (value as "scheduled" | "completed" | "cancelled")
    : "scheduled";
};

const formatCurrency = (value: number) => `£${value.toFixed(2)}`;

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

type CleanActionsModalProps = {
  open: boolean;
  onClose: () => void;
  property: ScheduleProperty | null;
  clean: ScheduleClean | null;
  context: CleanActionsContext;
  onCleanUpdated: (clean: ScheduleClean) => void;
};

export function CleanActionsModal({
  open,
  onClose,
  property,
  clean,
  context,
  onCleanUpdated,
}: CleanActionsModalProps) {
  const isCleanerContext = context.mode === "cleaner";
  const isIndividualCleaner =
    isCleanerContext && context.cleanerType === "individual";
  const canManageCleans = context.mode === "owner" || isIndividualCleaner;

  const [activeTab, setActiveTab] = useState<"details" | "actions">(
    canManageCleans ? "actions" : "details"
  );
  const [selectedStatus, setSelectedStatus] =
    useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [selectedMaintenanceNotes, setSelectedMaintenanceNotes] = useState<
    string[]
  >([]);
  const [notesMenuOpen, setNotesMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [savingClean, setSavingClean] = useState(false);

  const [newReimbursementItem, setNewReimbursementItem] = useState("");
  const [newReimbursementAmount, setNewReimbursementAmount] = useState("");
  const [addingReimbursement, setAddingReimbursement] = useState(false);

  const [editingReimbursementId, setEditingReimbursementId] =
    useState<string | null>(null);
  const [editReimbursementAmount, setEditReimbursementAmount] =
    useState("");
  const [editReimbursementItem, setEditReimbursementItem] = useState("");
  const [updatingReimbursement, setUpdatingReimbursement] = useState(false);
  const [deletingReimbursementId, setDeletingReimbursementId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (canManageCleans) {
      setActiveTab(clean ? "actions" : "details");
    } else {
      setActiveTab("details");
    }
  }, [open, canManageCleans, clean]);

  useEffect(() => {
    if (!clean) {
      setSelectedStatus("scheduled");
      setSelectedMaintenanceNotes([]);
      setNewReimbursementAmount("");
      setNewReimbursementItem("");
      setEditingReimbursementId(null);
      setEditReimbursementAmount("");
      setEditReimbursementItem("");
      setActionError(null);
      setActionSuccess(null);
      setNotesMenuOpen(false);
      return;
    }

    setSelectedStatus(normalizeStatusValue(clean.status));
    setSelectedMaintenanceNotes(clean.maintenance_notes ?? []);
    setNewReimbursementAmount("");
    setNewReimbursementItem("");
    setEditingReimbursementId(null);
    setEditReimbursementAmount("");
    setEditReimbursementItem("");
    setActionError(null);
    setActionSuccess(null);
    setNotesMenuOpen(false);
    if (canManageCleans) {
      setActiveTab(clean ? "actions" : "details");
    }
  }, [canManageCleans, clean?.id]);

  const baseCleanEndpoint = useMemo(() => {
    if (!clean) return null;
    if (isCleanerContext && context.token) {
      return `/api/cleaner-links/${context.token}/clean/${clean.id}`;
    }
    return `/api/cleans/${clean.id}`;
  }, [clean, context, isCleanerContext]);

  const reimbursementsEndpoint = useMemo(() => {
    if (!clean) return null;
    if (isCleanerContext && context.token) {
      return `/api/cleaner-links/${context.token}/clean/${clean.id}/reimbursements`;
    }
    return `/api/cleans/${clean.id}/reimbursements`;
  }, [clean, context, isCleanerContext]);

  const toggleMaintenanceNote = useCallback((note: string) => {
    setSelectedMaintenanceNotes((current) => {
      if (current.includes(note)) {
        return current.filter((item) => item !== note);
      }
      return [...current, note];
    });
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!clean || !baseCleanEndpoint || !canManageCleans) {
      return;
    }

    setSavingClean(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(baseCleanEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          maintenance_notes: selectedMaintenanceNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "Unable to save updates.");
      }

      const payload = (await response.json()) as { clean: ScheduleClean };
      onCleanUpdated(payload.clean);
      setSelectedStatus(normalizeStatusValue(payload.clean.status));
      setSelectedMaintenanceNotes(payload.clean.maintenance_notes ?? []);
      setActionSuccess("Updates saved.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to save updates."
      );
    } finally {
      setSavingClean(false);
    }
  }, [
    baseCleanEndpoint,
    canManageCleans,
    clean,
    onCleanUpdated,
    selectedMaintenanceNotes,
    selectedStatus,
  ]);

  const handleAddReimbursement = useCallback(async () => {
    if (!clean || !reimbursementsEndpoint || !canManageCleans) {
      return;
    }

    const amountValue = Number(newReimbursementAmount);
    if (!newReimbursementItem.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
      setActionError("Add a valid item and amount before logging a reimbursement.");
      return;
    }

    setAddingReimbursement(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(reimbursementsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          item: newReimbursementItem.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "Unable to add reimbursement.");
      }

      const payload = (await response.json()) as { clean: ScheduleClean };
      onCleanUpdated(payload.clean);
      setSelectedStatus(normalizeStatusValue(payload.clean.status));
      setSelectedMaintenanceNotes(payload.clean.maintenance_notes ?? []);
      setNewReimbursementAmount("");
      setNewReimbursementItem("");
      setActionSuccess("Reimbursement logged.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to add reimbursement."
      );
    } finally {
      setAddingReimbursement(false);
    }
  }, [
    canManageCleans,
    clean,
    newReimbursementAmount,
    newReimbursementItem,
    onCleanUpdated,
    reimbursementsEndpoint,
  ]);

  const beginEditingReimbursement = useCallback((reimbursementId: string, amount: number, item: string) => {
    setEditingReimbursementId(reimbursementId);
    setEditReimbursementAmount(amount.toString());
    setEditReimbursementItem(item);
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const cancelEditingReimbursement = useCallback(() => {
    setEditingReimbursementId(null);
    setEditReimbursementAmount("");
    setEditReimbursementItem("");
    setUpdatingReimbursement(false);
  }, []);

  const handleUpdateReimbursement = useCallback(async () => {
    if (
      !clean ||
      !reimbursementsEndpoint ||
      !canManageCleans ||
      !editingReimbursementId
    ) {
      return;
    }

    const amountValue = Number(editReimbursementAmount);
    if (!editReimbursementItem.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
      setActionError("Enter a valid amount and description before saving.");
      return;
    }

    setUpdatingReimbursement(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(reimbursementsEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reimbursement_id: editingReimbursementId,
          amount: amountValue,
          item: editReimbursementItem.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "Unable to update reimbursement.");
      }

      const payload = (await response.json()) as { clean: ScheduleClean };
      onCleanUpdated(payload.clean);
      setSelectedStatus(normalizeStatusValue(payload.clean.status));
      setSelectedMaintenanceNotes(payload.clean.maintenance_notes ?? []);
      setActionSuccess("Reimbursement updated.");
      cancelEditingReimbursement();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update reimbursement."
      );
    } finally {
      setUpdatingReimbursement(false);
    }
  }, [
    canManageCleans,
    cancelEditingReimbursement,
    clean,
    editReimbursementAmount,
    editReimbursementItem,
    editingReimbursementId,
    onCleanUpdated,
    reimbursementsEndpoint,
  ]);

  const handleDeleteReimbursement = useCallback(
    async (reimbursementId: string) => {
      if (!clean || !reimbursementsEndpoint || !canManageCleans) {
        return;
      }

      if (!confirm("Remove this reimbursement?")) {
        return;
      }

      setDeletingReimbursementId(reimbursementId);
      setActionError(null);
      setActionSuccess(null);

      try {
        const response = await fetch(reimbursementsEndpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reimbursement_id: reimbursementId }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error ?? "Unable to delete reimbursement.");
        }

        const payload = (await response.json()) as { clean: ScheduleClean };
        onCleanUpdated(payload.clean);
        setSelectedStatus(normalizeStatusValue(payload.clean.status));
        setSelectedMaintenanceNotes(payload.clean.maintenance_notes ?? []);
        setActionSuccess("Reimbursement removed.");
        if (editingReimbursementId === reimbursementId) {
          cancelEditingReimbursement();
        }
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to delete reimbursement."
        );
      } finally {
        setDeletingReimbursementId(null);
      }
    },
    [
      canManageCleans,
      cancelEditingReimbursement,
      clean,
      editingReimbursementId,
      onCleanUpdated,
      reimbursementsEndpoint,
    ]
  );

  const activeReimbursements = clean?.reimbursements ?? [];

  return (
    <Modal
      title={property?.name ?? "Property details"}
      open={open}
      onClose={onClose}
      footer={null}
    >
      {!property ? (
        <p className="text-sm text-[#EFF6E0]/70">
          Select a property to view its utility information and cleans.
        </p>
      ) : (
        <div className="space-y-6">
          {canManageCleans ? (
            <div className="flex items-center rounded-full bg-[#01161E]/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("details");
                  setActionError(null);
                  setActionSuccess(null);
                }}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150",
                  activeTab === "details"
                    ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                    : "text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
                )}
              >
                Utility details
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("actions");
                  setActionError(null);
                  setActionSuccess(null);
                }}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150",
                  activeTab === "actions"
                    ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                    : "text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
                )}
              >
                {context.mode === "owner"
                  ? "Manage clean"
                  : "Cleaner actions"}
              </button>
            </div>
          ) : null}

          {activeTab === "details" ? (
            <UtilityDetails property={property} />
          ) : null}

          {activeTab === "actions" ? (
            canManageCleans ? (
              clean ? (
                <div className="space-y-6 text-sm text-[#EFF6E0]/80">
                  <div className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                      Scheduled for
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#EFF6E0]">
                      {format(new Date(clean.scheduled_for), "EEE d MMM yyyy")} • {formatTime(clean.scheduled_for)}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                      Current status
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize text-[#EFF6E0]">
                      {clean.status}
                    </p>
                    {clean.notes ? (
                      <p className="mt-4 text-xs text-[#EFF6E0]/60">
                        Host note: {clean.notes}
                      </p>
                    ) : null}
                  </div>

                  <section className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                        Update status
                      </p>
                      <p className="text-xs text-[#EFF6E0]/60">
                        Choose the option that best reflects progress.
                      </p>
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="relative">
                        <select
                          value={selectedStatus}
                          onChange={(event) => {
                            setSelectedStatus(
                              normalizeStatusValue(event.target.value)
                            );
                            setActionError(null);
                            setActionSuccess(null);
                          }}
                          className="w-full appearance-none rounded-2xl border border-[#124559]/60 bg-[#01161E]/50 px-4 py-2 pr-10 text-sm font-semibold text-[#EFF6E0] focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/40"
                        >
                          {CLEAN_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/50" />
                      </div>
                      <p className="mt-2 text-[0.65rem] text-[#EFF6E0]/50">
                        {CLEAN_STATUS_OPTIONS.find(
                          (option) => option.value === selectedStatus
                        )?.description ?? ""}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                        Maintenance notes
                      </p>
                      <p className="text-xs text-[#EFF6E0]/60">
                        Pick the notes that apply to this clean.
                      </p>
                    </div>
                    <div className="relative w-full max-w-md">
                      <button
                        type="button"
                        onClick={() => setNotesMenuOpen((previous) => !previous)}
                        className={clsx(
                          "flex w-full items-center justify-between rounded-2xl border border-[#124559]/60 bg-[#01161E]/50 px-4 py-2 text-sm font-semibold text-[#EFF6E0] transition",
                          notesMenuOpen
                            ? "border-[#598392]"
                            : "hover:border-[#598392]/70"
                        )}
                      >
                        <span className="truncate text-left">
                          {selectedMaintenanceNotes.length
                            ? `${selectedMaintenanceNotes.length} note${
                                selectedMaintenanceNotes.length === 1 ? "" : "s"
                              } selected`
                            : "Select maintenance notes"}
                        </span>
                        <ChevronDownIcon
                          className={clsx(
                            "h-4 w-4 transition-transform",
                            notesMenuOpen ? "rotate-180" : ""
                          )}
                        />
                      </button>
                      {notesMenuOpen ? (
                        <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#124559]/60 bg-[#01161E]/95 p-2 shadow-xl shadow-[#01161E]/60 backdrop-blur">
                          {MAINTENANCE_NOTE_OPTIONS.map((note) => {
                            const isActive = selectedMaintenanceNotes.includes(note);
                            return (
                              <label
                                key={note}
                                className={clsx(
                                  "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-sm text-[#EFF6E0]/80 transition",
                                  isActive ? "bg-[#124559]/40" : "hover:bg-[#124559]/30"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => toggleMaintenanceNote(note)}
                                  className="mt-1 h-4 w-4 rounded border-[#598392]/60 bg-transparent text-[#598392] focus:ring-[#598392]"
                                />
                                <span>{note}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    {selectedMaintenanceNotes.length ? (
                      <p className="text-[0.65rem] text-[#EFF6E0]/50">
                        {selectedMaintenanceNotes.join(" • ")}
                      </p>
                    ) : (
                      <p className="text-[0.65rem] text-[#EFF6E0]/50">
                        The host will see any notes you select alongside this clean.
                      </p>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                        Reimbursements
                      </p>
                      <p className="text-xs text-[#EFF6E0]/60">
                        Log items you purchased so the host can refund you.
                      </p>
                    </div>
                    {activeReimbursements.length ? (
                      <ul className="space-y-2">
                        {activeReimbursements.map((entry) => {
                          const isEditing = editingReimbursementId === entry.id;
                          const isDeleting = deletingReimbursementId === entry.id;
                          return (
                            <li
                              key={entry.id}
                              className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 p-4"
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <div>
                                      <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                                        Amount
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editReimbursementAmount}
                                        onChange={(event) =>
                                          setEditReimbursementAmount(event.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                                        placeholder="0.00"
                                        inputMode="decimal"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                                        Item
                                      </label>
                                      <input
                                        type="text"
                                        value={editReimbursementItem}
                                        onChange={(event) =>
                                          setEditReimbursementItem(event.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                                        placeholder="Describe the item"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={cancelEditingReimbursement}
                                      className="rounded-full border border-[#598392]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[#EFF6E0]/70 transition hover:border-[#598392]/70 hover:text-[#EFF6E0]"
                                      disabled={updatingReimbursement}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleUpdateReimbursement}
                                      disabled={updatingReimbursement}
                                      className={clsx(
                                        "rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-xs font-semibold text-[#EFF6E0] transition hover:scale-[1.01]",
                                        updatingReimbursement ? "cursor-not-allowed opacity-60" : ""
                                      )}
                                    >
                                      {updatingReimbursement ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-[#EFF6E0]">
                                      {entry.item}
                                    </p>
                                    <span className="mt-1 block text-[0.65rem] text-[#EFF6E0]/50">
                                      {format(new Date(entry.created_at), "d MMM yyyy")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-[#EFF6E0]">
                                      {formatCurrency(Number(entry.amount))}
                                    </span>
                                    {canManageCleans ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            beginEditingReimbursement(
                                              entry.id,
                                              Number(entry.amount),
                                              entry.item
                                            )
                                          }
                                          className="flex items-center gap-1 rounded-full border border-[#598392]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80 transition hover:border-[#598392]/70 hover:text-[#EFF6E0]"
                                        >
                                          <PencilSquareIcon className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReimbursement(entry.id)}
                                          disabled={isDeleting}
                                          className={clsx(
                                            "flex items-center gap-1 rounded-full border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100",
                                            isDeleting ? "cursor-not-allowed opacity-60" : ""
                                          )}
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                          {isDeleting ? "Removing..." : "Delete"}
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-[#598392]/40 bg-[#01161E]/40 p-4 text-xs text-[#EFF6E0]/60">
                        No reimbursements logged yet.
                      </p>
                    )}

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div className="md:col-span-1">
                        <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                          Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newReimbursementAmount}
                          onChange={(event) => setNewReimbursementAmount(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                          placeholder="0.00"
                          inputMode="decimal"
                        />
                      </div>
                      <div className="md:col-span-1 md:col-start-2">
                        <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                          Item
                        </label>
                        <input
                          type="text"
                          value={newReimbursementItem}
                          onChange={(event) => setNewReimbursementItem(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                          placeholder="e.g. Cleaning supplies"
                        />
                      </div>
                      <div className="self-end md:col-span-1">
                        <button
                          type="button"
                          onClick={handleAddReimbursement}
                          disabled={addingReimbursement}
                          className={clsx(
                            "w-full rounded-full border border-[#598392] bg-[#598392]/20 px-4 py-2 text-sm font-semibold text-[#EFF6E0] transition-all duration-150 hover:bg-[#598392]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392]",
                            addingReimbursement ? "cursor-not-allowed opacity-60" : ""
                          )}
                        >
                          {addingReimbursement ? "Saving..." : "Log reimbursement"}
                        </button>
                      </div>
                    </div>
                  </section>

                  {actionError ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                      {actionError}
                    </div>
                  ) : null}
                  {actionSuccess ? (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                      {actionSuccess}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={savingClean}
                    className={clsx(
                      "w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-6 py-3 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/40 transition-transform duration-150 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392]",
                      savingClean ? "cursor-not-allowed opacity-60" : ""
                    )}
                  >
                    {savingClean ? "Saving..." : "Save updates"}
                  </button>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-[#598392]/40 bg-[#01161E]/40 p-4 text-sm text-[#EFF6E0]/70">
                  Select a clean from the timeline or table to update its status, add notes, or request reimbursements.
                </p>
              )
            ) : (
              <p className="rounded-2xl border border-dashed border-[#598392]/40 bg-[#01161E]/40 p-4 text-sm text-[#EFF6E0]/70">
                This view is read-only.
              </p>
            )
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function UtilityDetails({ property }: { property: ScheduleProperty }) {
  const details = [
    { label: "Address", value: property.property_address },
    { label: "Access codes", value: property.access_codes },
    { label: "Bin locations", value: property.bin_locations },
    { label: "Key locations", value: property.key_locations },
  ];

  const hasDetails = details.some(
    (detail) => detail.value && detail.value.trim().length > 0
  );

  return (
    <div className="space-y-4 text-sm text-[#EFF6E0]/80">
      {details
        .filter((detail) => detail.value && detail.value.trim().length > 0)
        .map((detail) => (
          <div key={detail.label} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
              {detail.label}
            </p>
            <p className="whitespace-pre-wrap text-[#EFF6E0]">
              {detail.value}
            </p>
          </div>
        ))}

      {!hasDetails ? (
        <p className="text-sm text-[#EFF6E0]/60">
          No utility details recorded for this property yet.
        </p>
      ) : null}
    </div>
  );
}
