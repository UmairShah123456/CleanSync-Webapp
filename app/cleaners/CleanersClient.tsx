"use client";

import { useCallback, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CleanerForm, type CleanerPayload } from "@/components/forms/CleanerForm";
import { Modal } from "@/components/ui/Modal";
import { CleanerList } from "./components/CleanerList";

export type CleanerWithAssignments = {
  id: string;
  name: string;
  cleaner_type: "individual" | "company";
  phone?: string | null;
  notes?: string | null;
  payment_details?: string | null;
  created_at?: string | null;
  assigned_properties: { id: string; name: string }[];
};

export function CleanersClient({
  email,
  initialCleaners,
}: {
  email?: string | null;
  initialCleaners: CleanerWithAssignments[];
}) {
  const [cleaners, setCleaners] =
    useState<CleanerWithAssignments[]>(initialCleaners);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCleaner, setEditingCleaner] =
    useState<CleanerWithAssignments | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCleaners = useCallback(async () => {
    const response = await fetch("/api/cleaners?view=full", {
      cache: "no-store",
    });
    if (!response.ok) {
      const { error: message } = await response.json();
      throw new Error(message ?? "Unable to load cleaners");
    }
    const data = (await response.json()) as CleanerWithAssignments[];
    setCleaners(data);
  }, []);

  const handleCreate = async (payload: CleanerPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(
          message ??
            "Unable to create cleaner. Make sure the cleaners table exists."
        );
      }
      await refreshCleaners();
      setAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create cleaner");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload: CleanerPayload) => {
    if (!editingCleaner) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaners/${editingCleaner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to update cleaner");
      }
      await refreshCleaners();
      setEditingCleaner(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update cleaner");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCleaner) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaners/${editingCleaner.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to delete cleaner");
      }
      await refreshCleaners();
      setEditingCleaner(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete cleaner");
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell email={email}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#EFF6E0]">Cleaners</h2>
            <p className="mt-1 text-base text-[#EFF6E0]/70">
              Track everyone who keeps your properties spotless.
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg"
          >
            Add cleaner
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <CleanerList cleaners={cleaners} onEdit={setEditingCleaner} />
      </div>

      <Modal
        title="Add a cleaner"
        open={addModalOpen}
        onClose={() => {
          if (!submitting) {
            setAddModalOpen(false);
          }
        }}
        footer={null}
      >
        <CleanerForm
          onSubmit={handleCreate}
          submitting={submitting}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>

      <Modal
        title="Edit cleaner"
        open={Boolean(editingCleaner)}
        onClose={() => {
          if (submitting || deleting) return;
          setEditingCleaner(null);
        }}
        footer={null}
      >
        {editingCleaner ? (
          <CleanerForm
            initial={{
              name: editingCleaner.name,
              phone: editingCleaner.phone ?? "",
              notes: editingCleaner.notes ?? "",
              payment_details: editingCleaner.payment_details ?? "",
              cleaner_type: editingCleaner.cleaner_type,
            }}
            onSubmit={handleUpdate}
            submitting={submitting}
            onCancel={() => setEditingCleaner(null)}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
