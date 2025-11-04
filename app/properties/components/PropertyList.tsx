"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowPathIcon,
  ClockIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { PropertyForm, PropertyPayload } from "@/components/forms/PropertyForm";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

export type Property = {
  id: string;
  name: string;
  ical_url: string;
  checkout_time?: string | null;
  cleaner?: string | null;
  created_at?: string;
};

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
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#124559]/70 text-sm font-semibold uppercase text-[#EFF6E0]"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ClockIcon;
  label: string;
  children: ReactNode;
}) => {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3 transition-colors duration-200 group-hover:border-[#598392]/50">
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#598392]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
          {label}
        </p>
        <div className="mt-1 text-sm text-[#EFF6E0]/80">{children}</div>
      </div>
    </div>
  );
};

export function PropertyList({
  properties,
  onDelete,
  onSync,
  onUpdate,
}: {
  properties: Property[];
  onDelete: (id: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onUpdate: (id: string, payload: PropertyPayload) => Promise<void>;
}) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Property | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleDelete = async (id: string) => {
    setLoadingAction(id);
    try {
      await onDelete(id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSync = async (id: string) => {
    setActionId(id);
    try {
      await onSync(id);
    } finally {
      setActionId(null);
    }
  };

  const handleUpdate = async (payload: PropertyPayload) => {
    if (!editing) return;
    setUpdating(true);
    try {
      await onUpdate(editing.id, payload);
      setEditing(null);
    } finally {
      setUpdating(false);
    }
  };

  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
        Add your first property to start syncing cleans.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <div
            key={property.id}
            className="group relative overflow-hidden rounded-2xl border border-[#124559]/50 bg-[#01161E]/60 p-6 shadow-lg shadow-[#01161E]/40 transition-all duration-300 hover:-translate-y-1 hover:border-[#598392]/60 hover:shadow-2xl hover:shadow-[#01161E]/60"
          >
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(circle at top right, rgba(89,131,146,0.35), transparent 55%)" }} />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <PropertyAvatar name={property.name} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-[#EFF6E0]">
                  {property.name}
                </h3>
                {property.created_at ? (
                  <p className="mt-1 text-xs text-[#EFF6E0]/50">
                    Added {formatDateTime(property.created_at)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[#EFF6E0]/40">
                    Synced property
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditing(property)}
                className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
                type="button"
                aria-label={`Edit ${property.name}`}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="relative z-10 mt-6 space-y-3 text-sm">
              <DetailRow icon={LinkIcon} label="Calendar feed">
                <a
                  href={property.ical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-[#EFF6E0] underline-offset-2 hover:underline"
                  title={property.ical_url}
                >
                  {property.ical_url}
                </a>
              </DetailRow>
              <DetailRow icon={ClockIcon} label="Checkout time">
                <span className="font-semibold text-[#EFF6E0]">
                  {property.checkout_time || "10:00"}
                </span>
              </DetailRow>
              <DetailRow icon={UserIcon} label="Assigned cleaner">
                <span className="font-medium text-[#EFF6E0]">
                  {property.cleaner ? property.cleaner : "Unassigned"}
                </span>
              </DetailRow>
            </div>
            <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={() => handleDelete(property.id)}
                disabled={loadingAction === property.id}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition-all hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <TrashIcon className="h-4 w-4" />
                {loadingAction === property.id ? "Removing..." : "Delete"}
              </button>
              <button
                onClick={() => handleSync(property.id)}
                disabled={actionId === property.id}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-xs font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${actionId === property.id ? "animate-spin" : ""}`}
                />
                {actionId === property.id ? "Syncing..." : "Sync now"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="Edit property"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        footer={null}
      >
        {editing ? (
          <PropertyForm
            initial={{
              name: editing.name,
              ical_url: editing.ical_url,
              checkout_time: editing.checkout_time || "10:00",
              cleaner: editing.cleaner || "",
            }}
            onSubmit={handleUpdate}
            submitting={updating}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}
