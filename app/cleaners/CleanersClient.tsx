"use client";

import { useCallback, useEffect, useState } from "react";
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
  link: { id: string; token: string; created_at?: string | null; updated_at?: string | null } | null;
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
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedCleanerIdForLink, setSelectedCleanerIdForLink] = useState<
    string | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkDeleting, setLinkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!cleaners.length) {
      setSelectedCleanerIdForLink(null);
      return;
    }
    if (
      selectedCleanerIdForLink &&
      !cleaners.some((cleaner) => cleaner.id === selectedCleanerIdForLink)
    ) {
      setSelectedCleanerIdForLink(cleaners[0].id);
    }
  }, [cleaners, selectedCleanerIdForLink]);

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

  const handleGenerateLink = async (cleanerId: string) => {
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      const response = await fetch(`/api/cleaners/${cleanerId}/link`, {
        method: "POST",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to generate link");
      }
      await refreshCleaners();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to generate link";
      setLinkError(message);
      throw err;
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleRefreshLink = async (cleanerId: string) => {
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      const response = await fetch(`/api/cleaners/${cleanerId}/link`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to refresh link");
      }
      await refreshCleaners();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to refresh link";
      setLinkError(message);
      throw err;
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleDeleteLink = async (cleanerId: string) => {
    setLinkDeleting(true);
    setLinkError(null);
    try {
      const response = await fetch(`/api/cleaners/${cleanerId}/link`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to delete link");
      }
      await refreshCleaners();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete link";
      setLinkError(message);
      throw err;
    } finally {
      setLinkDeleting(false);
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!cleaners.length) {
                  alert("Add a cleaner first.");
                  return;
                }
                setLinkError(null);
                setSelectedCleanerIdForLink(cleaners[0].id);
                setLinkModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#598392]/60 px-4 py-2 text-sm font-semibold text-[#EFF6E0] transition-all duration-200 hover:border-[#598392] hover:bg-[#124559]/40"
              type="button"
            >
              Create cleaner link
            </button>
            <button
              onClick={() => {
                setError(null);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg"
              type="button"
            >
              Add cleaner
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <CleanerList
          cleaners={cleaners}
          onEdit={setEditingCleaner}
          onGenerateLink={(cleaner) => {
            setLinkError(null);
            setSelectedCleanerIdForLink(cleaner.id);
            setLinkModalOpen(true);
          }}
          onRefreshLink={(cleaner) => {
            if (!cleaner.link) return;
            handleRefreshLink(cleaner.id).catch(() => {});
          }}
          onDeleteLink={(cleaner) => {
            if (!cleaner.link) return;
            handleDeleteLink(cleaner.id).catch(() => {});
          }}
        />
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

      <Modal
        title="Create cleaner link"
        open={linkModalOpen}
        onClose={() => {
          if (!linkSubmitting && !linkDeleting) {
            setLinkModalOpen(false);
          }
        }}
        footer={null}
      >
        <div className="space-y-5">
          <p className="text-sm text-[#EFF6E0]/70">
            Share a focused view with your cleaner. Company links show their
            assigned schedule. Individual links also let them mark cleans as
            completed.
          </p>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
              htmlFor="link-cleaner-select"
            >
              Choose cleaner
            </label>
            <select
              id="link-cleaner-select"
              value={selectedCleanerIdForLink ?? ""}
              onChange={(event) =>
                setSelectedCleanerIdForLink(
                  event.target.value || cleaners[0]?.id || null
                )
              }
              className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            >
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
          </div>

          {linkError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {linkError}
            </div>
          ) : null}

          {selectedCleanerIdForLink ? (
            <LinkPreview
              cleaner={
                cleaners.find((cleaner) => cleaner.id === selectedCleanerIdForLink)!
              }
              onGenerate={() =>
                handleGenerateLink(selectedCleanerIdForLink).catch(() => {})
              }
              onRefresh={() =>
                handleRefreshLink(selectedCleanerIdForLink).catch(() => {})
              }
              onDelete={() =>
                handleDeleteLink(selectedCleanerIdForLink).catch(() => {})
              }
              loadingGenerate={linkSubmitting}
              loadingDelete={linkDeleting}
            />
          ) : null}
        </div>
      </Modal>
    </AppShell>
  );
}

function LinkPreview({
  cleaner,
  onGenerate,
  onRefresh,
  onDelete,
  loadingGenerate,
  loadingDelete,
}: {
  cleaner: CleanerWithAssignments;
  onGenerate: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  loadingGenerate: boolean;
  loadingDelete: boolean;
}) {
  const linkUrl =
    typeof window !== "undefined" && cleaner.link
      ? `${window.location.origin}/cleaner/${cleaner.link.token}`
      : cleaner.link
      ? process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/cleaner/${cleaner.link.token}`
        : `/cleaner/${cleaner.link.token}`
      : "";

  return (
    <div className="space-y-4 rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-[#EFF6E0]">{cleaner.name}</p>
        <p className="text-xs text-[#EFF6E0]/60 capitalize">
          {cleaner.cleaner_type === "company"
            ? "Cleaning company"
            : "Individual cleaner"}
        </p>
        {cleaner.phone ? (
          <p className="mt-2 text-xs text-[#EFF6E0]/60">{cleaner.phone}</p>
        ) : null}
        {cleaner.notes ? (
          <p className="mt-2 text-xs text-[#EFF6E0]/60">{cleaner.notes}</p>
        ) : null}
      </div>

      {cleaner.link ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0]/80">
            {linkUrl || "Link ready"}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!cleaner.link) return;
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/cleaner/${cleaner.link.token}`
                    : linkUrl;
                if (url) {
                  navigator.clipboard.writeText(url);
                  alert("Link copied to clipboard.");
                }
              }}
              className="rounded-full border border-[#598392]/60 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392] hover:text-[#EFF6E0]"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={() => {
                if (!cleaner.link) return;
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/cleaner/${cleaner.link.token}`
                    : linkUrl;
                if (url) {
                  window.open(url, "_blank", "noopener");
                }
              }}
              className="rounded-full border border-[#598392]/60 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392] hover:text-[#EFF6E0]"
            >
              Open link
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loadingGenerate}
              className="rounded-full border border-[#124559]/60 px-4 py-2 text-xs font-semibold text-[#EFF6E0]/80 transition-all duration-200 hover:border-[#598392]/60 hover:text-[#EFF6E0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingGenerate ? "Refreshing..." : "Refresh link"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this link? The cleaner will lose access.")) {
                  onDelete();
                }
              }}
              disabled={loadingDelete}
              className="rounded-full border border-red-500/60 px-4 py-2 text-xs font-semibold text-red-200 transition-all duration-200 hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingDelete ? "Deleting..." : "Delete link"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#EFF6E0]/60">
            Generate a unique link tailored to this cleaner.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loadingGenerate}
            className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-xs font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingGenerate ? "Generating..." : "Generate link"}
          </button>
        </div>
      )}
    </div>
  );
}
