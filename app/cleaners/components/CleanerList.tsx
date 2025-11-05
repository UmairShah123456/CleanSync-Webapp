import { useState } from "react";
import {
  CalendarDaysIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";
import type { CleanerWithAssignments } from "../CleanersClient";

export function CleanerList({
  cleaners,
  onEdit,
  onGenerateLink,
  onRefreshLink,
  onDeleteLink,
}: {
  cleaners: CleanerWithAssignments[];
  onEdit: (cleaner: CleanerWithAssignments) => void;
  onGenerateLink: (cleaner: CleanerWithAssignments) => void;
  onRefreshLink: (cleaner: CleanerWithAssignments) => void;
  onDeleteLink: (cleaner: CleanerWithAssignments) => void;
}) {
  const [expandedCleanerDetails, setExpandedCleanerDetails] = useState<
    Set<string>
  >(new Set());
  if (!cleaners.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
        Add your first cleaner to start tracking assignments and availability.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cleaners.map((cleaner) => (
        <div
          key={cleaner.id}
          className="group relative overflow-hidden rounded-2xl border border-[#124559]/50 bg-[#01161E]/60 p-6 shadow-lg shadow-[#01161E]/40 transition-all duration-300 hover:-translate-y-1 hover:border-[#598392]/60 hover:shadow-2xl hover:shadow-[#01161E]/60"
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(89,131,146,0.35), transparent 55%)",
            }}
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-[#EFF6E0]">
                  {cleaner.name}
                </h3>
                <span className="rounded-full bg-[#124559]/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70">
                  {cleaner.cleaner_type === "company"
                    ? "Company"
                    : "Individual"}
                </span>
              </div>
              {cleaner.created_at ? (
                <p className="mt-1 text-xs text-[#EFF6E0]/50">
                  Added {formatDateTime(cleaner.created_at)}
                </p>
              ) : null}
            </div>
            <button
              onClick={() => onEdit(cleaner)}
              className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
              type="button"
              aria-label={`Edit ${cleaner.name}`}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const newExpanded = new Set(expandedCleanerDetails);
                if (newExpanded.has(cleaner.id)) {
                  newExpanded.delete(cleaner.id);
                } else {
                  newExpanded.add(cleaner.id);
                }
                setExpandedCleanerDetails(newExpanded);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#124559]/50 bg-[#124559]/40 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60"
              type="button"
            >
              {expandedCleanerDetails.has(cleaner.id) ? (
                <>
                  <ChevronUpIcon className="h-4 w-4" />
                  Hide Cleaner Details
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4" />
                  Cleaner Details
                </>
              )}
            </button>
          </div>

          {expandedCleanerDetails.has(cleaner.id) && (
            <div className="relative z-10 mt-4 space-y-3 text-sm">
              {cleaner.phone ? (
                <InfoRow
                  icon={PhoneIcon}
                  label="Phone"
                  value={
                    <span className="text-[#EFF6E0]">{cleaner.phone}</span>
                  }
                />
              ) : null}

              <InfoRow
                icon={BuildingOffice2Icon}
                label="Assigned properties"
                value={
                  cleaner.assigned_properties.length ? (
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
                  )
                }
              />

              {cleaner.notes ? (
                <InfoRow
                  icon={CalendarDaysIcon}
                  label="Notes"
                  value={
                    <p className="text-sm text-[#EFF6E0]/80">{cleaner.notes}</p>
                  }
                />
              ) : null}

              {cleaner.payment_details ? (
                <InfoRow
                  icon={CalendarDaysIcon}
                  label="Payment details"
                  value={
                    <p className="text-sm text-[#EFF6E0]/80">
                      {cleaner.payment_details}
                    </p>
                  }
                />
              ) : null}
            </div>
          )}

          <div className="relative z-10 mt-6">
            <div className="rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
                Cleaner link
              </p>
              {cleaner.link ? (
                <div className="mt-2 space-y-2">
                  <div className="truncate text-sm text-[#EFF6E0]/80">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/cleaner/${cleaner.link.token}`
                      : `/cleaner/${cleaner.link.token}`}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="group/button relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Generate a fresh link for this cleaner? The previous link will stop working."
                              )
                            ) {
                              onRefreshLink(cleaner);
                            }
                          }}
                          className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
                          aria-label="Refresh link"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#01161E]/95 px-2 py-1 text-xs font-medium text-[#EFF6E0] opacity-0 shadow-lg transition-opacity duration-200 group-hover/button:opacity-100">
                          Refresh
                        </span>
                      </div>
                      <div className="group/button relative">
                        <button
                          type="button"
                          onClick={() => {
                            const url =
                              typeof window !== "undefined"
                                ? `${window.location.origin}/cleaner/${
                                    cleaner.link!.token
                                  }`
                                : `/cleaner/${cleaner.link!.token}`;
                            if (
                              typeof navigator !== "undefined" &&
                              navigator.clipboard
                            ) {
                              navigator.clipboard.writeText(url);
                              alert("Link copied to clipboard.");
                            } else {
                              prompt("Copy link", url);
                            }
                          }}
                          className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
                          aria-label="Copy link"
                        >
                          <ClipboardIcon className="h-5 w-5" />
                        </button>
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#01161E]/95 px-2 py-1 text-xs font-medium text-[#EFF6E0] opacity-0 shadow-lg transition-opacity duration-200 group-hover/button:opacity-100">
                          Copy link
                        </span>
                      </div>
                      <div className="group/button relative">
                        <button
                          type="button"
                          onClick={() => {
                            const url =
                              typeof window !== "undefined"
                                ? `${window.location.origin}/cleaner/${
                                    cleaner.link!.token
                                  }`
                                : `/cleaner/${cleaner.link!.token}`;
                            window.open(url, "_blank", "noopener");
                          }}
                          className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
                          aria-label="Open link"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </button>
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#01161E]/95 px-2 py-1 text-xs font-medium text-[#EFF6E0] opacity-0 shadow-lg transition-opacity duration-200 group-hover/button:opacity-100">
                          Open
                        </span>
                      </div>
                    </div>
                    <div className="group/button relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this link? The cleaner will lose access until you generate a new one."
                            )
                          ) {
                            onDeleteLink(cleaner);
                          }
                        }}
                        className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-red-200 transition-colors hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-100"
                        aria-label="Delete link"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#01161E]/95 px-2 py-1 text-xs font-medium text-[#EFF6E0] opacity-0 shadow-lg transition-opacity duration-200 group-hover/button:opacity-100">
                        Delete
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-[#EFF6E0]/60">
                    No link created yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => onGenerateLink(cleaner)}
                    className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-3 py-1.5 text-xs font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    Generate link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDaysIcon;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3">
    <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#598392]" />
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
        {label}
      </p>
      <div className="mt-1 text-sm text-[#EFF6E0]/80">{value}</div>
    </div>
  </div>
);
