"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";
import type { CleanerWithAssignments } from "../CleanersClient";

const getInitials = (name: string): string => {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean);
  if (!parts.length) return "CL";
  return parts.slice(0, 2).join("");
};

const CleanerAvatar = ({ name }: { name: string }) => {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#124559]/70 text-sm font-semibold uppercase text-[#EFF6E0]"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

export function CleanerListSidebar({
  cleaners,
  selectedCleanerId,
  onSelectCleaner,
  onAddCleaner,
}: {
  cleaners: CleanerWithAssignments[];
  selectedCleanerId: string | null;
  onSelectCleaner: (cleaner: CleanerWithAssignments) => void;
  onAddCleaner: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-[#124559]/40 bg-[#01161E]">
      {/* Header with Add Button */}
      <div className="border-b border-[#124559]/40 p-4">
        <button
          onClick={onAddCleaner}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#124559]/50 bg-[#124559]/40 px-4 py-2.5 text-sm font-semibold text-[#EFF6E0] transition-all duration-200 hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:shadow-md"
          type="button"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add cleaner</span>
        </button>
      </div>

      {/* Scrollable Cleaner List */}
      <div className="flex-1 overflow-y-auto">
        {cleaners.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-center text-sm text-[#EFF6E0]/50">
              No cleaners yet.
              <br />
              Click above to add your first cleaner.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#124559]/30">
            {cleaners.map((cleaner) => {
              const isSelected = selectedCleanerId === cleaner.id;
              return (
                <button
                  key={cleaner.id}
                  onClick={() => onSelectCleaner(cleaner)}
                  className={`
                    w-full px-4 py-3 text-left transition-all duration-200
                    ${
                      isSelected
                        ? "bg-[#124559]/50 border-l-2 border-[#598392]"
                        : "hover:bg-[#124559]/20 active:bg-[#124559]/30"
                    }
                  `}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <CleanerAvatar name={cleaner.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isSelected ? "text-[#EFF6E0]" : "text-[#EFF6E0]/90"
                          }`}
                        >
                          {cleaner.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-[#124559]/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70">
                          {cleaner.cleaner_type === "company"
                            ? "Company"
                            : "Individual"}
                        </span>
                      </div>
                      {cleaner.created_at ? (
                        <p className="mt-0.5 text-xs text-[#EFF6E0]/50">
                          {formatDateTime(cleaner.created_at)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-[#EFF6E0]/40">
                          Synced cleaner
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

