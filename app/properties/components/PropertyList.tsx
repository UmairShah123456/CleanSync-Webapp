"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PropertyForm, PropertyPayload } from "@/components/forms/PropertyForm";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

export type Property = {
  id: string;
  name: string;
  ical_url: string;
  created_at?: string;
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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div
            key={property.id}
            className="rounded-xl border border-[#124559]/50 bg-[#124559] p-5 shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-[#EFF6E0]">
                  {property.name}
                </h3>
                <p className="mt-1 truncate text-sm text-[#EFF6E0]/70">
                  {property.ical_url}
                </p>
                {property.created_at ? (
                  <p className="mt-2 text-xs text-[#EFF6E0]/50">
                    Added {formatDateTime(property.created_at)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-5 text-sm">
              <button
                onClick={() => setEditing(property)}
                className="text-[#EFF6E0] hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(property.id)}
                disabled={loadingAction === property.id}
                className="text-red-400 hover:underline disabled:opacity-50"
              >
                {loadingAction === property.id ? "Removing..." : "Delete"}
              </button>
              <button
                onClick={() => handleSync(property.id)}
                disabled={actionId === property.id}
                className="ml-auto rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-xs font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
              >
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
            initial={{ name: editing.name, ical_url: editing.ical_url }}
            onSubmit={handleUpdate}
            submitting={updating}
          />
        ) : null}
      </Modal>
    </>
  );
}
