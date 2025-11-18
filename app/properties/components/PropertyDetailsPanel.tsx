"use client";

import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import {
  ClockIcon,
  LinkIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  PropertyForm,
  type PropertyPayload,
} from "@/components/forms/PropertyForm";
import type { Property } from "./PropertyList";

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ClockIcon;
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

type ActiveTab = "details" | "utility" | "checklist";

export function PropertyDetailsPanel({
  property,
  onClose,
  onUpdate,
  onDelete,
  onRefresh,
  isMobile,
}: {
  property: Property | null;
  onClose: () => void;
  onUpdate: (id: string, payload: PropertyPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isMobile?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [editing, setEditing] = useState(false);
  const [editingUtility, setEditingUtility] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utilityFormData, setUtilityFormData] = useState({
    access_codes: "",
    bin_locations: "",
    property_address: "",
    key_locations: "",
  });
  const [checklistData, setChecklistData] = useState({
    items: property?.cleaning_checklists || [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState({
    room: "",
    task: "",
  });

  // Reset editing state when property changes
  useEffect(() => {
    setEditing(false);
    setEditingUtility(false);
    setEditingChecklist(false);
    setError(null);
    if (property) {
      setUtilityFormData({
        access_codes: property.access_codes || "",
        bin_locations: property.bin_locations || "",
        property_address: property.property_address || "",
        key_locations: property.key_locations || "",
      });
      setChecklistData({
        items: property.cleaning_checklists || [],
      });
    }
  }, [property?.id, property?.cleaning_checklists]);

  if (!property) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center text-sm text-[#EFF6E0]/50">
          Select a property to view details
        </p>
      </div>
    );
  }

  const handleUpdate = async (payload: PropertyPayload) => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdate(property.id, payload);
      setEditing(false);
      setEditingUtility(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update property"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleUtilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    try {
      await onUpdate(property.id, {
        name: property.name,
        ical_url: property.ical_url,
        checkout_time: property.checkout_time || "10:00",
        cleaner: property.cleaner || "",
        access_codes: utilityFormData.access_codes,
        bin_locations: utilityFormData.bin_locations,
        property_address: utilityFormData.property_address,
        key_locations: utilityFormData.key_locations,
      });
      setEditingUtility(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save on-site details"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${property.name}"? This action cannot be undone and will remove all associated cleans and bookings.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await onDelete(property.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete property"
      );
    } finally {
      setDeleting(false);
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
                  aria-label="Back to properties"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-[#EFF6E0]">
                  {property.name}
                </h2>
                {property.created_at && (
                  <p className="mt-1 text-xs text-[#EFF6E0]/50">
                    Added {new Date(property.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && !editingUtility && !editingChecklist && (
                <button
                  onClick={() => {
                    if (activeTab === "details") {
                      setEditing(true);
                    } else if (activeTab === "utility") {
                      setEditingUtility(true);
                    } else if (activeTab === "checklist") {
                      setEditingChecklist(true);
                    }
                  }}
                  className="rounded-lg border-[#124559]/50 bg-[#124559]/40 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:text-[#EFF6E0]"
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

        {/* Tabs */}
        <div className="border-b border-[#124559]/40 px-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("details");
                setEditing(false);
                setEditingUtility(false);
                setEditingChecklist(false);
              }}
              className={clsx(
                "rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "details"
                  ? "border-[#598392] text-[#EFF6E0]"
                  : "border-transparent text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
              )}
            >
              Property Details
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("utility");
                setEditing(false);
                setEditingUtility(false);
                setEditingChecklist(false);
              }}
              className={clsx(
                "rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "utility"
                  ? "border-[#598392] text-[#EFF6E0]"
                  : "border-transparent text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
              )}
            >
              On-site Details
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("checklist");
                setEditing(false);
                setEditingUtility(false);
                setEditingChecklist(false);
              }}
              className={clsx(
                "rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "checklist"
                  ? "border-[#598392] text-[#EFF6E0]"
                  : "border-transparent text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
              )}
            >
              Cleaning Checklist
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4">
              {editing ? (
                <PropertyForm
                  initial={{
                    name: property.name,
                    ical_url: property.ical_url,
                    checkout_time: property.checkout_time || "10:00",
                    cleaner: property.cleaner || "",
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
                <>
                  <div className="space-y-3">
                    <DetailRow icon={LinkIcon} label="Calendar feed">
                      <a
                        href={property.ical_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[#598392] underline-offset-2 hover:underline"
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

                  <div className="flex flex-wrap gap-2 pt-4">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:border-red-400/60 hover:bg-red-500/30 disabled:opacity-50"
                      type="button"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "utility" && (
            <div className="space-y-4">
              {editingUtility ? (
                <form onSubmit={handleUtilityUpdate} className="space-y-5">
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
                      htmlFor="property_address"
                    >
                      Property Address
                    </label>
                    <textarea
                      id="property_address"
                      value={utilityFormData.property_address}
                      onChange={(e) =>
                        setUtilityFormData({
                          ...utilityFormData,
                          property_address: e.target.value,
                        })
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
                      value={utilityFormData.access_codes}
                      onChange={(e) =>
                        setUtilityFormData({
                          ...utilityFormData,
                          access_codes: e.target.value,
                        })
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
                      value={utilityFormData.key_locations}
                      onChange={(e) =>
                        setUtilityFormData({
                          ...utilityFormData,
                          key_locations: e.target.value,
                        })
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
                      value={utilityFormData.bin_locations}
                      onChange={(e) =>
                        setUtilityFormData({
                          ...utilityFormData,
                          bin_locations: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
                      placeholder="Enter bin locations (e.g., recycling bin, general waste)"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUtility(false);
                        setError(null);
                        // Reset form data to original property values
                        if (property) {
                          setUtilityFormData({
                            access_codes: property.access_codes || "",
                            bin_locations: property.bin_locations || "",
                            property_address: property.property_address || "",
                            key_locations: property.key_locations || "",
                          });
                        }
                      }}
                      className="rounded-full border border-[#124559]/50 px-5 py-2.5 text-sm font-semibold text-[#EFF6E0]/70 transition-colors duration-200 hover:border-[#598392]/60 hover:text-[#EFF6E0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-5 py-2.5 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/50 transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-3">
                    {property.property_address ? (
                      <DetailRow icon={WrenchScrewdriverIcon} label="Address">
                        <p className="whitespace-pre-wrap text-[#EFF6E0]">
                          {property.property_address}
                        </p>
                      </DetailRow>
                    ) : null}
                    {property.access_codes ? (
                      <DetailRow
                        icon={WrenchScrewdriverIcon}
                        label="Access codes"
                      >
                        <p className="whitespace-pre-wrap text-[#EFF6E0]">
                          {property.access_codes}
                        </p>
                      </DetailRow>
                    ) : null}
                    {property.bin_locations ? (
                      <DetailRow
                        icon={WrenchScrewdriverIcon}
                        label="Bin locations"
                      >
                        <p className="whitespace-pre-wrap text-[#EFF6E0]">
                          {property.bin_locations}
                        </p>
                      </DetailRow>
                    ) : null}
                    {property.key_locations ? (
                      <DetailRow
                        icon={WrenchScrewdriverIcon}
                        label="Key locations"
                      >
                        <p className="whitespace-pre-wrap text-[#EFF6E0]">
                          {property.key_locations}
                        </p>
                      </DetailRow>
                    ) : null}
                  </div>

                  {!property.property_address &&
                    !property.access_codes &&
                    !property.bin_locations &&
                    !property.key_locations && (
                      <p className="text-sm text-[#EFF6E0]/60">
                        No on-site details recorded for this property yet.
                      </p>
                    )}
                </>
              )}
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-4">
              <CleaningChecklistTab
                checklistData={checklistData}
                setChecklistData={setChecklistData}
                newChecklistItem={newChecklistItem}
                setNewChecklistItem={setNewChecklistItem}
                propertyId={property.id}
                onRefresh={onRefresh}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Room options for the cleaning checklist
const ROOM_OPTIONS = [
  "Bedroom",
  "Living Room",
  "Bathroom",
  "Kitchen",
  "Entrance",
  "Hallway",
  "Patio",
  "Garden",
  "Other",
];

// Component for the cleaning checklist tab
function CleaningChecklistTab({
  checklistData,
  setChecklistData,
  newChecklistItem,
  setNewChecklistItem,
  propertyId,
  onRefresh,
}: {
  checklistData: {
    items: Array<{
      id: string;
      room: string;
      task: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
    }>;
  };
  setChecklistData: React.Dispatch<
    React.SetStateAction<{
      items: Array<{
        id: string;
        room: string;
        task: string;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>;
    }>
  >;
  newChecklistItem: { room: string; task: string };
  setNewChecklistItem: React.Dispatch<
    React.SetStateAction<{ room: string; task: string }>
  >;
  propertyId: string;
  onRefresh?: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [showRoomSuggestions, setShowRoomSuggestions] = useState(false);
  const [filteredRooms, setFilteredRooms] = useState<string[]>([]);

  // Get unique room names from existing checklist items
  const existingRooms = useMemo(() => {
    const rooms = new Set<string>();
    checklistData.items.forEach((item) => {
      if (item.room.trim()) {
        rooms.add(item.room);
      }
    });
    return Array.from(rooms).sort();
  }, [checklistData.items]);

  // All available room options (existing + predefined)
  const allRoomOptions = useMemo(() => {
    const all = [...existingRooms];
    ROOM_OPTIONS.forEach((room) => {
      if (!all.includes(room)) {
        all.push(room);
      }
    });
    return all;
  }, [existingRooms]);

  // Filter rooms based on input
  useEffect(() => {
    const input = newChecklistItem.room.toLowerCase().trim();
    if (input.length > 0) {
      const filtered = allRoomOptions.filter((room) =>
        room.toLowerCase().includes(input)
      );
      setFilteredRooms(filtered);
      setShowRoomSuggestions(filtered.length > 0);
    } else {
      setFilteredRooms([]);
      setShowRoomSuggestions(false);
    }
  }, [newChecklistItem.room, allRoomOptions]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.room.trim() || !newChecklistItem.task.trim()) {
      setError("Both room and task are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Call the API to add the new checklist item
      const response = await fetch(`/api/properties/${propertyId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: newChecklistItem.room,
          task: newChecklistItem.task,
          sort_order: checklistData.items.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to add checklist item.");
      }

      const result = await response.json();

      // Add the new item to the local state with the ID from the API
      const updatedItems = [
        ...checklistData.items,
        {
          id: result.id,
          room: result.room,
          task: result.task,
          sort_order: result.sort_order,
          created_at: result.created_at,
          updated_at: result.updated_at,
        },
      ];

      setChecklistData({ items: updatedItems });
      setNewChecklistItem({ room: "", task: "" });

      // Refresh property data to ensure it's in sync
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add checklist item."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this checklist item?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Call the API to delete the checklist item
      const response = await fetch(
        `/api/properties/${propertyId}/checklist/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to delete checklist item.");
      }

      // Remove the item from the local state
      const updatedItems = checklistData.items.filter((item) => item.id !== id);
      setChecklistData({ items: updatedItems });

      // Refresh property data to ensure it's in sync
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete checklist item."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMoveItem = (id: string, direction: "up" | "down") => {
    const items = [...checklistData.items];
    const index = items.findIndex((item) => item.id === id);

    if (index !== -1) {
      if (direction === "up" && index > 0) {
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
      } else if (direction === "down" && index < items.length - 1) {
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
      }

      // Update sort_order based on new positions
      const updatedItems = items.map((item, idx) => ({
        ...item,
        sort_order: idx,
      }));

      setChecklistData({ items: updatedItems });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#EFF6E0]">
          Add New Checklist Item
        </h3>
        <form onSubmit={handleAddItem} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
                Room
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newChecklistItem.room}
                  onChange={(e) =>
                    setNewChecklistItem({
                      ...newChecklistItem,
                      room: e.target.value,
                    })
                  }
                  onFocus={() => {
                    if (filteredRooms.length > 0) {
                      setShowRoomSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicking on suggestions
                    setTimeout(() => setShowRoomSuggestions(false), 200);
                  }}
                  className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60"
                  placeholder="Enter room name or select from existing"
                />
                {showRoomSuggestions && filteredRooms.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[#124559]/60 bg-[#01161E] shadow-lg">
                    {filteredRooms.map((room) => (
                      <button
                        key={room}
                        type="button"
                        onClick={() => {
                          setNewChecklistItem({
                            ...newChecklistItem,
                            room: room,
                          });
                          setShowRoomSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[#EFF6E0] transition-colors hover:bg-[#124559]/50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {room}
                        {existingRooms.includes(room) && (
                          <span className="ml-2 text-xs text-[#598392]">
                            (existing)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-[#EFF6E0]/50">
                {existingRooms.length > 0
                  ? `Existing rooms: ${existingRooms.join(", ")}`
                  : "You can add multiple rooms of the same type"}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
                Task
              </label>
              <input
                type="text"
                value={newChecklistItem.task}
                onChange={(e) =>
                  setNewChecklistItem({
                    ...newChecklistItem,
                    task: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-3 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60"
                placeholder="Enter cleaning task"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2.5 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/50 transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Checklist Item"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#EFF6E0]">
            Current Checklist
          </h3>
          <span className="text-sm text-[#EFF6E0]/70">
            {checklistData.items.length}{" "}
            {checklistData.items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {checklistData.items.length === 0 ? (
          <p className="text-sm text-[#EFF6E0]/60">
            No checklist items added yet. Add items using the form above.
          </p>
        ) : (
          <div className="space-y-2">
            {(() => {
              // Group items by room
              const groupedByRoom = checklistData.items.reduce((acc, item) => {
                if (!acc[item.room]) {
                  acc[item.room] = [];
                }
                acc[item.room].push(item);
                return acc;
              }, {} as Record<string, typeof checklistData.items>);

              // Sort rooms and items within each room
              const sortedRooms = Object.keys(groupedByRoom).sort();

              return sortedRooms.map((room) => {
                const roomItems = groupedByRoom[room].sort(
                  (a, b) => a.sort_order - b.sort_order
                );
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
                          ({roomItems.length}{" "}
                          {roomItems.length === 1 ? "item" : "items"})
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#124559]/40 space-y-2 p-2">
                        {roomItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-[#124559]/30 bg-[#01161E]/60 px-3 py-2"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-[#EFF6E0]">
                                {item.task}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMoveItem(item.id, "up")}
                                disabled={item.sort_order === 0}
                                className="rounded-lg border border-[#124559]/50 bg-[#124559]/40 p-1.5 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:text-[#EFF6E0] disabled:opacity-40"
                                aria-label="Move up"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMoveItem(item.id, "down")}
                                disabled={
                                  item.sort_order ===
                                  checklistData.items.length - 1
                                }
                                className="rounded-lg border border-[#124559]/50 bg-[#124559]/40 p-1.5 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/60 hover:text-[#EFF6E0] disabled:opacity-40"
                                aria-label="Move down"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={saving}
                                className="rounded-lg border border-red-500/50 bg-red-500/20 p-1.5 text-red-200 transition-colors hover:border-red-400/60 hover:bg-red-500/30"
                                aria-label="Delete item"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
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
        )}
      </div>
    </div>
  );
}
