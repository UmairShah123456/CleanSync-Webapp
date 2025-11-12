"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import {
  ClockIcon,
  LinkIcon,
  PencilSquareIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WrenchScrewdriverIcon,
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
  access_codes?: string | null;
  bin_locations?: string | null;
  property_address?: string | null;
  key_locations?: string | null;
  cleaning_checklists?: Array<{
    id: string;
    room: string;
    task: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }> | null;
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

export const UtilityDetailsModal = ({
  property,
  onClose,
  onUpdate,
}: {
  property: Property | null;
  onClose: () => void;
  onUpdate: (payload: PropertyPayload) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    access_codes: property?.access_codes || "",
    bin_locations: property?.bin_locations || "",
    property_address: property?.property_address || "",
    key_locations: property?.key_locations || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        access_codes: property.access_codes || "",
        bin_locations: property.bin_locations || "",
        property_address: property.property_address || "",
        key_locations: property.key_locations || "",
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onUpdate({
        name: property!.name,
        ical_url: property!.ical_url,
        checkout_time: property!.checkout_time || "10:00",
        cleaner: property!.cleaner || "",
        access_codes: formData.access_codes,
        bin_locations: formData.bin_locations,
        property_address: formData.property_address,
        key_locations: formData.key_locations,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save utility details"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!property) return null;

  return (
    <Modal
      title="Utility Details"
      open={Boolean(property)}
      onClose={onClose}
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="property_address"
          >
            Property Address
          </label>
          <textarea
            id="property_address"
            value={formData.property_address}
            onChange={(e) =>
              setFormData({ ...formData, property_address: e.target.value })
            }
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            placeholder="Enter property address"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="access_codes"
          >
            Access Codes
          </label>
          <textarea
            id="access_codes"
            value={formData.access_codes}
            onChange={(e) =>
              setFormData({ ...formData, access_codes: e.target.value })
            }
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            placeholder="Enter access codes (e.g., WiFi password, door codes)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="key_locations"
          >
            Key Locations
          </label>
          <textarea
            id="key_locations"
            value={formData.key_locations}
            onChange={(e) =>
              setFormData({ ...formData, key_locations: e.target.value })
            }
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            placeholder="Enter key locations (e.g., lockbox code, key safe location)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="bin_locations"
          >
            Bin Locations
          </label>
          <textarea
            id="bin_locations"
            value={formData.bin_locations}
            onChange={(e) =>
              setFormData({ ...formData, bin_locations: e.target.value })
            }
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            placeholder="Enter bin locations (e.g., recycling bin, general waste)"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#124559]/50 px-5 py-2.5 text-sm font-semibold text-[#EFF6E0]/70 transition-colors duration-200 hover:border-[#598392]/60 hover:text-[#EFF6E0]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-5 py-2.5 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/50 transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export function PropertyList({
  properties,
  onDelete,
  onUpdate,
}: {
  properties: Property[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, payload: PropertyPayload) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Property | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [expandedPropertyDetails, setExpandedPropertyDetails] = useState<
    Set<string>
  >(new Set());
  const [utilityDetailsProperty, setUtilityDetailsProperty] =
    useState<Property | null>(null);

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

  const handleDeleteFromModal = async () => {
    if (!editing) return;

    if (
      !confirm(
        `Are you sure you want to delete "${editing.name}"? This action cannot be undone and will remove all associated cleans and bookings.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setModalError(null);
    try {
      await onDelete(editing.id);
      setEditing(null);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Unable to delete property."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center">
        <p className="text-sm text-[#EFF6E0]/70">
          Add your first property to start syncing cleans.
        </p>
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
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(89,131,146,0.35), transparent 55%)",
              }}
            />
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
              <div className="flex items-center gap-2">
                <div className="group/button relative">
                  <button
                    onClick={() => {
                      setModalError(null);
                      setDeleting(false);
                      setEditing(property);
                    }}
                    className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
                    type="button"
                    aria-label={`Edit ${property.name}`}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#01161E]/95 px-2 py-1 text-xs font-medium text-[#EFF6E0] opacity-0 shadow-lg transition-opacity duration-200 group-hover/button:opacity-100">
                    Edit
                  </span>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedPropertyDetails);
                  if (newExpanded.has(property.id)) {
                    newExpanded.delete(property.id);
                  } else {
                    newExpanded.add(property.id);
                  }
                  setExpandedPropertyDetails(newExpanded);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#124559]/50 bg-[#124559]/40 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60"
                type="button"
              >
                {expandedPropertyDetails.has(property.id) ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4" />
                    Hide Property Details
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4" />
                    Property Details
                  </>
                )}
              </button>
              <button
                onClick={() => setUtilityDetailsProperty(property)}
                className="inline-flex items-center gap-2 rounded-full border border-[#124559]/50 bg-[#124559]/40 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60"
                type="button"
              >
                <WrenchScrewdriverIcon className="h-4 w-4" />
                Utility Details
              </button>
            </div>
            {expandedPropertyDetails.has(property.id) && (
              <div className="relative z-10 mt-4 space-y-3 text-sm">
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
            )}
          </div>
        ))}
      </div>

      <Modal
        title="Edit property"
        open={Boolean(editing)}
        onClose={() => {
          setModalError(null);
          setEditing(null);
          setDeleting(false);
        }}
        footer={null}
      >
        {editing ? (
          <>
            {modalError ? (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
                {modalError}
              </div>
            ) : null}
            <PropertyForm
              initial={{
                name: editing.name,
                ical_url: editing.ical_url,
                checkout_time: editing.checkout_time || "10:00",
                cleaner: editing.cleaner || "",
              }}
              onSubmit={handleUpdate}
              submitting={updating}
              onCancel={() => {
                setModalError(null);
                setEditing(null);
                setDeleting(false);
              }}
              onDelete={handleDeleteFromModal}
              deleting={deleting}
            />
          </>
        ) : null}
      </Modal>

      <UtilityDetailsModal
        property={utilityDetailsProperty}
        onClose={() => setUtilityDetailsProperty(null)}
        onUpdate={async (payload) => {
          if (utilityDetailsProperty) {
            await onUpdate(utilityDetailsProperty.id, payload);
            setUtilityDetailsProperty(null);
          }
        }}
      />
    </>
  );
}
