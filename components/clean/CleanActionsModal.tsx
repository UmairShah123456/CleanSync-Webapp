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
import type { Translations } from "@/lib/translations/cleanerPortal";

type CleanerContext = {
  mode: "cleaner";
  cleanerType: "individual" | "company";
  token: string | null;
};

type OwnerContext = {
  mode: "owner";
};

export type CleanActionsContext = CleanerContext | OwnerContext;

const getCleanStatusOptions = (t?: Translations) => [
  {
    value: "scheduled" as const,
    label: t?.scheduled || "Scheduled",
    description:
      t?.scheduledDescription ||
      "Use while the clean is pending or in progress.",
  },
  {
    value: "completed" as const,
    label: t?.completed || "Completed",
    description:
      t?.completedDescription ||
      "Confirm once the clean is finished and walkthrough is done.",
  },
  {
    value: "cancelled" as const,
    label: t?.cancelled || "Cancelled",
    description:
      t?.cancelledDescription ||
      "Only use if the clean is no longer going ahead.",
  },
];

const MAINTENANCE_NOTE_OPTIONS = [
  "Restocked toiletries and consumables",
  "Left fresh linens and towels ready for guests",
  "Flagged wear and tear that needs attention",
  "Replenished on-site cleaning supplies",
  "Captured photos for reported damage",
];

const STATUS_VALUE_SET = new Set(["scheduled", "completed", "cancelled"]);

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
  translations?: Translations;
};

export function CleanActionsModal({
  open,
  onClose,
  property,
  clean,
  context,
  onCleanUpdated,
  translations,
}: CleanActionsModalProps) {
  const isCleanerContext = context.mode === "cleaner";
  const canManageCleans = context.mode === "owner" || isCleanerContext;

  const [activeTab, setActiveTab] = useState<
    "details" | "actions" | "checklist" | "maintenance"
  >(canManageCleans ? "actions" : "details");
  const [selectedStatus, setSelectedStatus] = useState<
    "scheduled" | "completed" | "cancelled"
  >("scheduled");
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

  const [editingReimbursementId, setEditingReimbursementId] = useState<
    string | null
  >(null);
  const [editReimbursementAmount, setEditReimbursementAmount] = useState("");
  const [editReimbursementItem, setEditReimbursementItem] = useState("");
  const [updatingReimbursement, setUpdatingReimbursement] = useState(false);
  const [deletingReimbursementId, setDeletingReimbursementId] = useState<
    string | null
  >(null);

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
        throw new Error(
          error?.error ??
            (translations?.unableToSave || "Unable to save updates.")
        );
      }

      const payload = (await response.json()) as { clean: ScheduleClean };
      onCleanUpdated(payload.clean);
      setSelectedStatus(normalizeStatusValue(payload.clean.status));
      setSelectedMaintenanceNotes(payload.clean.maintenance_notes ?? []);
      setActionSuccess(translations?.updatesSaved || "Updates saved.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : translations?.unableToSave || "Unable to save updates."
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
    if (
      !newReimbursementItem.trim() ||
      !Number.isFinite(amountValue) ||
      amountValue <= 0
    ) {
      setActionError(
        "Add a valid item and amount before logging a reimbursement."
      );
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

  const beginEditingReimbursement = useCallback(
    (reimbursementId: string, amount: number, item: string) => {
      setEditingReimbursementId(reimbursementId);
      setEditReimbursementAmount(amount.toString());
      setEditReimbursementItem(item);
      setActionError(null);
      setActionSuccess(null);
    },
    []
  );

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
    if (
      !editReimbursementItem.trim() ||
      !Number.isFinite(amountValue) ||
      amountValue <= 0
    ) {
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

  const statusDropdown = canManageCleans && clean ? (
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
        className="appearance-none rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2 pr-8 text-sm font-semibold text-[#EFF6E0] focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/40 [&>option]:bg-[#01161E]"
        style={{
          backgroundColor:
            selectedStatus === "cancelled"
              ? "rgba(239, 68, 68, 0.2)"
              : selectedStatus === "completed"
              ? "rgba(16, 185, 129, 0.2)"
              : selectedStatus === "scheduled"
              ? "rgba(168, 85, 247, 0.2)"
              : "#01161E",
        }}
      >
        {getCleanStatusOptions(translations).map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{
              backgroundColor:
                option.value === "cancelled"
                  ? "#1f1f1f"
                  : option.value === "completed"
                  ? "#1f1f1f"
                  : option.value === "scheduled"
                  ? "#1f1f1f"
                  : "#01161E",
              color:
                option.value === "cancelled"
                  ? "#ef4444"
                  : option.value === "completed"
                  ? "#10b981"
                  : option.value === "scheduled"
                  ? "#a855f7"
                  : "#EFF6E0",
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EFF6E0]/50" />
    </div>
  ) : null;

  return (
    <Modal
      title={property?.name ?? "Property details"}
      open={open}
      onClose={onClose}
      footer={null}
      headerRight={statusDropdown}
    >
      {!property ? (
        <p className="text-sm text-[#EFF6E0]/70">
          {translations?.selectPropertyViewDetails ||
            "Select a property to view its utility information and cleans."}
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
                  "rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm",
                  activeTab === "details"
                    ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                    : "text-[#EFF6E0]/70 active:text-[#EFF6E0] sm:hover:text-[#EFF6E0]"
                )}
              >
                {translations?.utilityDetails || "Utility details"}
              </button>
              {isCleanerContext ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("checklist");
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  className={clsx(
                    "rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm",
                    activeTab === "checklist"
                      ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                      : "text-[#EFF6E0]/70 active:text-[#EFF6E0] sm:hover:text-[#EFF6E0]"
                  )}
                >
                  {"Checklist"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("actions");
                  setActionError(null);
                  setActionSuccess(null);
                }}
                className={clsx(
                  "rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm",
                  activeTab === "actions"
                    ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                    : "text-[#EFF6E0]/70 active:text-[#EFF6E0] sm:hover:text-[#EFF6E0]"
                )}
              >
                {context.mode === "owner"
                  ? translations?.manageClean || "Manage clean"
                  : translations?.cleanerActions || "Cleaner actions"}
              </button>
              {clean?.maintenance_notes && clean.maintenance_notes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("maintenance");
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  className={clsx(
                    "rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm relative",
                    activeTab === "maintenance"
                      ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                      : "text-[#EFF6E0]/70 active:text-[#EFF6E0] sm:hover:text-[#EFF6E0]"
                  )}
                >
                  Cleaner Notes
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/30 text-[10px] text-orange-300">
                    {clean.maintenance_notes.length}
                  </span>
                </button>
              )}
            </div>
          ) : null}

          {activeTab === "details" ? (
            <UtilityDetails property={property} />
          ) : null}

          {activeTab === "checklist" ? (
            <ChecklistTab
              property={property}
              clean={clean}
              context={context}
              onCleanUpdated={onCleanUpdated}
              translations={translations}
            />
          ) : null}

          {activeTab === "actions" ? (
            canManageCleans ? (
              clean ? (
                <div className="space-y-6 text-sm text-[#EFF6E0]/80">
                  <div className="rounded-xl border border-[#124559]/40 bg-[#01161E]/50 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50 sm:text-xs">
                      {translations?.scheduledFor || "Scheduled for"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#EFF6E0] leading-relaxed sm:text-sm">
                      {format(new Date(clean.scheduled_for), "EEE d MMM yyyy")}{" "}
                      <span className="hidden sm:inline">•</span>
                      <span className="block sm:inline sm:ml-1">
                        {formatTime(clean.scheduled_for)}
                      </span>
                    </p>
                    <p className="mt-3 text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50 sm:mt-4 sm:text-xs">
                      {translations?.currentStatus || "Current status"}
                    </p>
                    <p className="mt-1 text-xs font-semibold capitalize text-[#EFF6E0] sm:text-sm">
                      {clean.status}
                    </p>
                    {clean.notes ? (
                      <div className="mt-3">
                        <p className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50 sm:text-xs">
                          {translations?.notes || "Host Notes"}
                        </p>
                        <p className="mt-1 text-xs text-[#EFF6E0]/80 whitespace-pre-wrap">
                          {clean.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {isCleanerContext && (
                    <section className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                          {translations?.maintenanceNotes || "Cleaner Notes"}
                        </p>
                        <p className="text-xs text-[#EFF6E0]/60">
                          {translations?.pickNotesApplyToClean ||
                            "Pick the notes that apply to this clean."}
                        </p>
                      </div>
                    <div className="relative w-full">
                      <button
                        type="button"
                        onClick={() =>
                          setNotesMenuOpen((previous) => !previous)
                        }
                        className={clsx(
                          "flex w-full items-center justify-between rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-4 py-3 text-sm font-semibold text-[#EFF6E0] transition active:scale-[0.98] sm:rounded-2xl sm:py-2",
                          notesMenuOpen
                            ? "border-[#598392]"
                            : "active:border-[#598392]/70 sm:hover:border-[#598392]/70"
                        )}
                      >
                        <span className="truncate text-left">
                          {selectedMaintenanceNotes.length
                            ? `${selectedMaintenanceNotes.length} ${
                                selectedMaintenanceNotes.length === 1
                                  ? translations?.note || "note"
                                  : translations?.notesPlural || "notes"
                              } ${translations?.selected || "selected"}`
                            : translations?.selectMaintenanceNotes ||
                              "Select notes"}
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
                          {(
                            translations?.maintenanceNoteOptions ||
                            MAINTENANCE_NOTE_OPTIONS
                          ).map((note) => {
                            const isActive =
                              selectedMaintenanceNotes.includes(note);
                            return (
                              <label
                                key={note}
                                className={clsx(
                                  "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-sm text-[#EFF6E0]/80 transition",
                                  isActive
                                    ? "bg-[#124559]/40"
                                    : "hover:bg-[#124559]/30"
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
                        {translations?.hostWillSeeNotesSelected ||
                          "The host will see any notes you select alongside this clean."}
                      </p>
                    )}
                    </section>
                  )}

                  {isCleanerContext && (
                    <section className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#EFF6E0]/50">
                          {translations?.reimbursements || "Reimbursements"}
                        </p>
                      <p className="text-xs text-[#EFF6E0]/60">
                        {translations?.logItemsPurchasedForRefund ||
                          "Log items you purchased so the host can refund you."}
                      </p>
                    </div>
                    {activeReimbursements.length ? (
                      <ul className="space-y-2">
                        {activeReimbursements.map((entry) => {
                          const isEditing = editingReimbursementId === entry.id;
                          const isDeleting =
                            deletingReimbursementId === entry.id;
                          return (
                            <li
                              key={entry.id}
                              className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 p-4"
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                                        {translations?.amount || "Amount"}
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editReimbursementAmount}
                                        onChange={(event) =>
                                          setEditReimbursementAmount(
                                            event.target.value
                                          )
                                        }
                                        className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                                        placeholder="0.00"
                                        inputMode="decimal"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                                        {translations?.item || "Item"}
                                      </label>
                                      <input
                                        type="text"
                                        value={editReimbursementItem}
                                        onChange={(event) =>
                                          setEditReimbursementItem(
                                            event.target.value
                                          )
                                        }
                                        className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                                        placeholder={
                                          translations?.item || "Item"
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEditingReimbursement}
                                      className="w-full rounded-full border border-[#598392]/40 bg-transparent px-4 py-2.5 text-xs font-semibold text-[#EFF6E0]/70 transition active:border-[#598392]/70 active:text-[#EFF6E0] sm:w-auto sm:hover:border-[#598392]/70 sm:hover:text-[#EFF6E0]"
                                      disabled={updatingReimbursement}
                                    >
                                      {translations?.cancel || "Cancel"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleUpdateReimbursement}
                                      disabled={updatingReimbursement}
                                      className={clsx(
                                        "w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2.5 text-xs font-semibold text-[#EFF6E0] transition active:scale-[0.98] sm:w-auto sm:hover:scale-[1.01]",
                                        updatingReimbursement
                                          ? "cursor-not-allowed opacity-60"
                                          : ""
                                      )}
                                    >
                                      {updatingReimbursement
                                        ? translations?.saving || "Saving..."
                                        : translations?.saveUpdates || "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#EFF6E0] break-words">
                                      {entry.item}
                                    </p>
                                    <span className="mt-1 block text-[0.65rem] text-[#EFF6E0]/50">
                                      {format(
                                        new Date(entry.created_at),
                                        "d MMM yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-sm font-semibold text-[#EFF6E0] shrink-0">
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
                                          className="flex items-center gap-1 rounded-full border border-[#598392]/40 px-3 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition active:border-[#598392]/70 active:text-[#EFF6E0] sm:py-1 sm:hover:border-[#598392]/70 sm:hover:text-[#EFF6E0]"
                                        >
                                          <PencilSquareIcon className="h-4 w-4" />{" "}
                                          <span className="hidden sm:inline">
                                            {translations?.edit || "Edit"}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteReimbursement(entry.id)
                                          }
                                          disabled={isDeleting}
                                          className={clsx(
                                            "flex items-center gap-1 rounded-full border border-red-400/50 px-3 py-2 text-xs font-semibold text-red-200 transition active:border-red-300 active:text-red-100 sm:py-1 sm:hover:border-red-300 sm:hover:text-red-100",
                                            isDeleting
                                              ? "cursor-not-allowed opacity-60"
                                              : ""
                                          )}
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                          <span className="hidden sm:inline">
                                            {isDeleting
                                              ? translations?.removing ||
                                                "Removing..."
                                              : translations?.delete ||
                                                "Delete"}
                                          </span>
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
                        {translations?.noReimbursementsLogged ||
                          "No reimbursements logged yet."}
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                          {translations?.amount || "Amount"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newReimbursementAmount}
                          onChange={(event) =>
                            setNewReimbursementAmount(event.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                          placeholder="0.00"
                          inputMode="decimal"
                        />
                      </div>
                      <div>
                        <label className="text-[0.65rem] uppercase tracking-wide text-[#EFF6E0]/50">
                          {translations?.item || "Item"}
                        </label>
                        <input
                          type="text"
                          value={newReimbursementItem}
                          onChange={(event) =>
                            setNewReimbursementItem(event.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/50 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/50"
                          placeholder={
                            translations?.cleaningSuppliesExample ||
                            "e.g. Cleaning supplies"
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddReimbursement}
                          disabled={addingReimbursement}
                          className={clsx(
                            "w-full rounded-full border border-[#598392] bg-[#598392]/20 px-4 py-3 text-sm font-semibold text-[#EFF6E0] transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392] sm:py-2 sm:hover:bg-[#598392]/30",
                            addingReimbursement
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          )}
                        >
                          {addingReimbursement
                            ? translations?.saving || "Saving..."
                            : translations?.logReimbursement ||
                              "Log reimbursement"}
                        </button>
                      </div>
                    </div>
                    </section>
                  )}

                  {actionError ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200 ">
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
                      "w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-6 py-3.5 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/40 transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392] sm:py-3 sm:hover:scale-[1.01]",
                      savingClean ? "cursor-not-allowed opacity-60" : ""
                    )}
                  >
                    {savingClean
                      ? translations?.saving || "Saving..."
                      : translations?.saveUpdates || "Save updates"}
                  </button>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-[#598392]/40 bg-[#01161E]/40 p-4 text-sm text-[#EFF6E0]/70">
                  {translations?.selectCleanToUpdate ||
                    "Select a clean from the timeline or table to update its status, add notes, or request reimbursements."}
                </p>
              )
            ) : (
              <p className="rounded-2xl border border-dashed border-[#598392]/40 bg-[#01161E]/40 p-4 text-sm text-[#EFF6E0]/70">
                {translations?.readOnly || "This view is read-only."}
              </p>
            )
          ) : null}

          {activeTab === "maintenance" && clean?.maintenance_notes && clean.maintenance_notes.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#124559]/40 bg-[#01161E]/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#EFF6E0]">
                  Notes from Cleaner
                </h3>
                <div className="space-y-2">
                  {clean.maintenance_notes.map((note, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/30">
                        <svg
                          className="h-4 w-4 text-orange-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-orange-200">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#EFF6E0]/60">
                These notes were added by the cleaner during or after the clean. Please review and address them as needed.
              </p>
            </div>
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
    <div className="space-y-3 text-xs text-[#EFF6E0]/80 sm:space-y-4 sm:text-sm">
      {details
        .filter((detail) => detail.value && detail.value.trim().length > 0)
        .map((detail) => (
          <div key={detail.label} className="space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/60 sm:text-xs">
              {detail.label}
            </p>
            <p className="whitespace-pre-wrap break-words text-[#EFF6E0] leading-relaxed">
              {detail.value}
            </p>
          </div>
        ))}

      {!hasDetails ? (
        <p className="text-xs text-[#EFF6E0]/60 sm:text-sm">
          No utility details recorded for this property yet.
        </p>
      ) : null}
    </div>
  );
}

// Checklist tab component for cleaners to mark items as completed
function ChecklistTab({
  property,
  clean,
  context,
  onCleanUpdated,
  translations,
}: {
  property: ScheduleProperty;
  clean: ScheduleClean | null;
  context: CleanActionsContext;
  onCleanUpdated: (clean: ScheduleClean) => void;
  translations?: Translations;
}) {
  const [checklistItems, setChecklistItems] = useState(() => {
    if (property?.cleaning_checklists && clean?.checklist_completions) {
      return property.cleaning_checklists.map((item) => {
        const completion = clean.checklist_completions?.find(
          (comp) => comp.checklist_item_id === item.id
        );
        return {
          ...item,
          completed: completion?.completed || false,
          completed_at: completion?.completed_at || null,
        };
      });
    }
    return (
      property?.cleaning_checklists?.map((item) => ({
        ...item,
        completed: false,
        completed_at: null,
      })) || []
    );
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const isCleanerContext = context.mode === "cleaner";
  const baseChecklistEndpoint = useMemo(() => {
    if (!clean?.id) return null;
    if (isCleanerContext && context.token) {
      return `/api/cleaner-links/${context.token}/clean/${clean.id}/checklist`;
    }
    return `/api/cleans/${clean.id}/checklist`;
  }, [clean?.id, isCleanerContext, context]);

  // Update checklist items when property or clean changes
  useEffect(() => {
    if (property?.cleaning_checklists && clean?.checklist_completions) {
      setChecklistItems(
        property.cleaning_checklists.map((item) => {
          const completion = clean.checklist_completions?.find(
            (comp) => comp.checklist_item_id === item.id
          );
          return {
            ...item,
            completed: completion?.completed || false,
            completed_at: completion?.completed_at || null,
          };
        })
      );
    } else {
      setChecklistItems(
        property?.cleaning_checklists?.map((item) => ({
          ...item,
          completed: false,
          completed_at: null,
        })) || []
      );
    }
  }, [property?.cleaning_checklists, clean?.checklist_completions]);

  const toggleChecklistItem = useCallback(
    async (itemId: string) => {
      if (!isCleanerContext || !baseChecklistEndpoint) {
        return;
      }

      const itemIndex = checklistItems.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return;

      const currentItem = checklistItems[itemIndex];
      const newCompletedStatus = !currentItem.completed;

      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch(baseChecklistEndpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checklist_item_id: itemId,
            completed: newCompletedStatus,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || "Unable to update checklist item."
          );
        }

        const result = await response.json();

        // If the API returns the updated clean object, update the parent
        if (result.clean) {
          onCleanUpdated(result.clean);
        }

        // Update the checklist items with the new status
        const updatedItems = [...checklistItems];
        updatedItems[itemIndex] = {
          ...currentItem,
          completed: newCompletedStatus,
          completed_at: newCompletedStatus ? new Date().toISOString() : null,
        };

        setChecklistItems(updatedItems);
        setSuccess(
          newCompletedStatus
            ? "Item marked as completed"
            : "Item marked as incomplete"
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update checklist item."
        );
      } finally {
        setSaving(false);
      }
    },
    [checklistItems, isCleanerContext, baseChecklistEndpoint]
  );

  if (
    !property?.cleaning_checklists ||
    property.cleaning_checklists.length === 0
  ) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#EFF6E0]/60">
          No checklist items set for this property.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          {success}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#EFF6E0]">
            Cleaning Checklist
          </h3>
          <span className="text-sm text-[#EFF6E0]/70">
            {checklistItems.filter((item) => item.completed).length} /{" "}
            {checklistItems.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {(() => {
            // Group items by room
            const groupedByRoom = checklistItems.reduce((acc, item) => {
              if (!acc[item.room]) {
                acc[item.room] = [];
              }
              acc[item.room].push(item);
              return acc;
            }, {} as Record<string, typeof checklistItems>);

            // Sort rooms and items within each room
            const sortedRooms = Object.keys(groupedByRoom).sort();

            return sortedRooms.map((room) => {
              const roomItems = groupedByRoom[room].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const completedCount = roomItems.filter(
                (item) => item.completed
              ).length;
              const isExpanded = expandedRooms.has(room);

              return (
                <div
                  key={room}
                  className="rounded-xl border border-[#124559]/40 bg-[#01161E]/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedRooms((prev) => {
                        const next = new Set(prev);
                        if (next.has(room)) {
                          next.delete(room);
                        } else {
                          next.add(room);
                        }
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#124559]/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDownIcon
                        className={clsx(
                          "h-4 w-4 text-[#598392] transition-transform",
                          isExpanded ? "rotate-180" : ""
                        )}
                      />
                      <span className="text-sm font-semibold text-[#EFF6E0]">
                        {room}
                      </span>
                      <span className="text-xs text-[#EFF6E0]/60">
                        ({completedCount} / {roomItems.length})
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#124559]/40 space-y-2 p-2">
                      {roomItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-lg border border-[#124559]/30 bg-[#01161E]/60 px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => toggleChecklistItem(item.id)}
                            disabled={saving || !isCleanerContext}
                            className={clsx(
                              "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition",
                              item.completed
                                ? "border-emerald-500/80 bg-emerald-500/30"
                                : "border-[#598392]/60 bg-[#01161E]/50",
                              saving || !isCleanerContext
                                ? "opacity-50"
                                : "hover:border-[#598392]/80"
                            )}
                            aria-label={
                              item.completed
                                ? "Mark as incomplete"
                                : "Mark as complete"
                            }
                          >
                            {item.completed && (
                              <svg
                                className="h-4 w-4 text-emerald-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span
                              className={clsx(
                                "font-medium block",
                                item.completed
                                  ? "text-emerald-400 line-through"
                                  : "text-[#EFF6E0]"
                              )}
                            >
                              {item.task}
                            </span>
                            {item.completed_at && (
                              <p className="mt-1 text-xs text-emerald-400/80">
                                Completed:{" "}
                                {new Date(item.completed_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
