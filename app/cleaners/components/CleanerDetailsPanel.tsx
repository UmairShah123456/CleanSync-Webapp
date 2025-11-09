"use client";

import { useState, useEffect } from "react";
import {
  PhoneIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClipboardIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  CleanerForm,
  type CleanerPayload,
} from "@/components/forms/CleanerForm";
import type { CleanerWithAssignments } from "../CleanersClient";

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof PhoneIcon;
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3 transition-colors duration-200 group-hover:border-[#598392]/50">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#598392]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
          {label}
        </p>
        <div className="mt-1 text-sm text-[#EFF6E0]/80">{children}</div>
      </div>
    </div>
  );
};

export function CleanerDetailsPanel({
  cleaner,
  onClose,
  onUpdate,
  onDelete,
  onGenerateLink,
  onRefreshLink,
  onDeleteLink,
  isMobile,
}: {
  cleaner: CleanerWithAssignments | null;
  onClose: () => void;
  onUpdate: (payload: CleanerPayload) => Promise<void>;
  onDelete: () => Promise<void>;
  onGenerateLink: () => Promise<void>;
  onRefreshLink: () => Promise<void>;
  onDeleteLink: () => Promise<void>;
  isMobile?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkDeleting, setLinkDeleting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset editing state when cleaner changes
  useEffect(() => {
    setEditing(false);
    setError(null);
    setLinkError(null);
    setCopiedLink(false);
  }, [cleaner?.id]);

  // Auto-dismiss copied message
  useEffect(() => {
    if (copiedLink) {
      const timer = setTimeout(() => setCopiedLink(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedLink]);

  if (!cleaner) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center text-sm text-[#EFF6E0]/50">
          Select a cleaner to view details
        </p>
      </div>
    );
  }

  const handleUpdate = async (payload: CleanerPayload) => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdate(payload);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update cleaner"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${cleaner.name}"? This action cannot be undone and will remove all associated cleaner links.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete cleaner"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateLink = async () => {
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      await onGenerateLink();
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Unable to generate link"
      );
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleRefreshLink = async () => {
    if (
      !confirm(
        "Generate a fresh link for this cleaner? The previous link will stop working."
      )
    ) {
      return;
    }

    setLinkSubmitting(true);
    setLinkError(null);
    try {
      await onRefreshLink();
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Unable to refresh link"
      );
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleDeleteLink = async () => {
    if (
      !confirm(
        "Delete this link? The cleaner will lose access until you generate a new one."
      )
    ) {
      return;
    }

    setLinkDeleting(true);
    setLinkError(null);
    try {
      await onDeleteLink();
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Unable to delete link"
      );
    } finally {
      setLinkDeleting(false);
    }
  };

  const linkUrl =
    typeof window !== "undefined" && cleaner.link
      ? `${window.location.origin}/cleaner/${cleaner.link.token}`
      : cleaner.link
      ? `/cleaner/${cleaner.link.token}`
      : "";

  const handleCopyLink = () => {
    if (linkUrl && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(linkUrl);
      setCopiedLink(true);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col bg-[#01161E]">
        {/* Header */}
        <div className="border-b border-[#124559]/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {isMobile && (
                <button
                  onClick={onClose}
                  className="mt-0.5 shrink-0 rounded-lg border border-[#124559]/50 bg-[#124559]/40 p-2 text-[#EFF6E0]/80 transition-colors active:bg-[#124559]/60 hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:text-[#EFF6E0]"
                  type="button"
                  aria-label="Back to cleaners"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#EFF6E0]">
                    {cleaner.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-[#124559]/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70">
                    {cleaner.cleaner_type === "company"
                      ? "Company"
                      : "Individual"}
                  </span>
                </div>
                {cleaner.created_at && (
                  <p className="mt-1 text-xs text-[#EFF6E0]/50">
                    Added {new Date(cleaner.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-[#124559]/50 bg-[#124559]/40 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:text-[#EFF6E0]"
                  type="button"
                  aria-label="Edit"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              )}
              {isMobile && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-[#EFF6E0]/70 transition-colors hover:bg-[#124559]/40 hover:text-[#EFF6E0] lg:hidden"
                  type="button"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {linkError && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {linkError}
            </div>
          )}

          {editing ? (
            <CleanerForm
              initial={{
                name: cleaner.name,
                phone: cleaner.phone ?? "",
                notes: cleaner.notes ?? "",
                payment_details: cleaner.payment_details ?? "",
                cleaner_type: cleaner.cleaner_type,
              }}
              onSubmit={handleUpdate}
              submitting={updating}
              onCancel={() => {
                setEditing(false);
                setError(null);
              }}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {cleaner.phone && (
                  <DetailRow icon={PhoneIcon} label="Phone">
                    <span className="font-medium text-[#EFF6E0]">
                      {cleaner.phone}
                    </span>
                  </DetailRow>
                )}

                <DetailRow icon={BuildingOffice2Icon} label="Assigned properties">
                  {cleaner.assigned_properties.length ? (
                    <div className="flex flex-wrap gap-2">
                      {cleaner.assigned_properties.map((property) => (
                        <span
                          key={property.id}
                          className="rounded-full border border-[#598392]/40 bg-[#124559]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80"
                        >
                          {property.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#EFF6E0]/50">Not assigned yet</span>
                  )}
                </DetailRow>

                {cleaner.notes && (
                  <DetailRow icon={CalendarDaysIcon} label="Notes">
                    <p className="whitespace-pre-wrap text-[#EFF6E0]">
                      {cleaner.notes}
                    </p>
                  </DetailRow>
                )}

                {cleaner.payment_details && (
                  <DetailRow icon={CalendarDaysIcon} label="Payment details">
                    <p className="whitespace-pre-wrap text-[#EFF6E0]">
                      {cleaner.payment_details}
                    </p>
                  </DetailRow>
                )}
              </div>

              {/* Cleaner Link Section */}
              <div className="rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-[#598392]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
                    Cleaner link
                  </p>
                </div>
                {cleaner.link ? (
                  <div className="mt-3 space-y-3">
                    <div className="relative">
                      {copiedLink && (
                        <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-full border border-[#598392]/40 bg-[#124559]/60 px-3 py-1 text-xs font-semibold text-[#EFF6E0] shadow-lg z-10">
                          <CheckIcon className="h-3.5 w-3.5 text-[#9AD1D4]" />
                          Copied!
                        </div>
                      )}
                      <div className="truncate rounded-lg border border-[#124559]/60 bg-[#01161E]/70 px-3 py-2 text-sm text-[#EFF6E0]/80">
                        {linkUrl}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 rounded-full border border-[#598392]/60 px-3 py-1.5 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392] hover:text-[#EFF6E0]"
                      >
                        {copiedLink ? (
                          <CheckIcon className="h-4 w-4 text-[#9AD1D4]" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4" />
                        )}
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (linkUrl) {
                            window.open(linkUrl, "_blank", "noopener");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#598392]/60 px-3 py-1.5 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392] hover:text-[#EFF6E0]"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        Open link
                      </button>
                      <button
                        type="button"
                        onClick={handleRefreshLink}
                        disabled={linkSubmitting}
                        className="inline-flex items-center gap-2 rounded-full border border-[#124559]/60 px-3 py-1.5 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392]/60 hover:text-[#EFF6E0] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        {linkSubmitting ? "Refreshing..." : "Refresh link"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteLink}
                        disabled={linkDeleting}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/60 px-3 py-1.5 text-xs font-semibold text-red-200 transition-all duration-200 hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {linkDeleting ? "Deleting..." : "Delete link"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-[#EFF6E0]/60">
                      Generate a unique link tailored to this cleaner.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      disabled={linkSubmitting}
                      className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-xs font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {linkSubmitting ? "Generating..." : "Generate link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

