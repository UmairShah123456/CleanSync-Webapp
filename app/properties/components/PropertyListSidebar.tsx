"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";
import type { Property } from "./PropertyList";

const getInitials = (name: string): string => {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean);
  if (!parts.length) return "PR";
  return parts.slice(0, 2).join("");
};

const PropertyAvatar = ({ name }: { name: string }) => {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#124559]/70 text-sm font-semibold uppercase text-[#EFF6E0]"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

export function PropertyListSidebar({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onAddProperty,
}: {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (property: Property) => void;
  onAddProperty: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-[#124559]/40 bg-[#01161E]">
      {/* Header with Add Button */}
      <div className="border-b border-[#124559]/40 p-4">
        <button
          onClick={onAddProperty}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#124559]/50 bg-[#124559]/40 px-4 py-2.5 text-sm font-semibold text-[#EFF6E0] transition-all duration-200 hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:shadow-md"
          type="button"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add property</span>
        </button>
      </div>

      {/* Scrollable Property List */}
      <div className="flex-1 overflow-y-auto">
        {properties.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-center text-sm text-[#EFF6E0]/50">
              No properties yet.
              <br />
              Click above to add your first property.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#124559]/30">
            {properties.map((property) => {
              const isSelected = selectedPropertyId === property.id;
              return (
                <button
                  key={property.id}
                  onClick={() => onSelectProperty(property)}
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
                    <PropertyAvatar name={property.name} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isSelected ? "text-[#EFF6E0]" : "text-[#EFF6E0]/90"
                        }`}
                      >
                        {property.name}
                      </p>
                      {property.created_at ? (
                        <p className="mt-0.5 text-xs text-[#EFF6E0]/50">
                          {formatDateTime(property.created_at)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-[#EFF6E0]/40">
                          Synced property
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
