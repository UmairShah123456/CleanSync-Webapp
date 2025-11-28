"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CleanerForm,
  type CleanerPayload,
} from "@/components/forms/CleanerForm";
import { Modal } from "@/components/ui/Modal";
import { CleanerListSidebar } from "./components/CleanerListSidebar";
import { CleanerDetailsPanel } from "./components/CleanerDetailsPanel";

export type CleanerWithAssignments = {
  id: string;
  name: string;
  cleaner_type: "individual" | "company";
  phone?: string | null;
  notes?: string | null;
  payment_details?: string | null;
  created_at?: string | null;
  assigned_properties: { id: string; name: string }[];
  link: {
    id: string;
    token: string;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
};

export function CleanersClient({
  email,
  userName,
  initialCleaners,
}: {
  email?: string | null;
  userName?: string | null;
  initialCleaners: CleanerWithAssignments[];
}) {
  const [cleaners, setCleaners] =
    useState<CleanerWithAssignments[]>(initialCleaners);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(
    null
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Remember last selected cleaner from localStorage
  useEffect(() => {
    if (cleaners.length === 0) return;

    const saved = localStorage.getItem("lastSelectedCleanerId");
    if (saved && cleaners.some((c) => c.id === saved)) {
      setSelectedCleanerId(saved);
    } else if (!selectedCleanerId) {
      // Auto-select first cleaner if none selected
      setSelectedCleanerId(cleaners[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaners.length]);

  // Save selected cleaner to localStorage
  useEffect(() => {
    if (selectedCleanerId) {
      localStorage.setItem("lastSelectedCleanerId", selectedCleanerId);
    }
  }, [selectedCleanerId]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create cleaner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload: CleanerPayload) => {
    if (!selectedCleanerId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaners/${selectedCleanerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to update cleaner");
      }
      await refreshCleaners();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update cleaner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCleanerId) return;
    const cleaner = cleaners.find((c) => c.id === selectedCleanerId);
    const cleanerName = cleaner?.name || "this cleaner";

    if (
      !confirm(
        `Are you sure you want to delete "${cleanerName}"? This action cannot be undone and will remove all associated cleaner links.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaners/${selectedCleanerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to delete cleaner");
      }
      await refreshCleaners();
      setSelectedCleanerId(null);
      if (isMobile) {
        setDetailsPanelOpen(false);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete cleaner");
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedCleanerId) return;
    try {
      const response = await fetch(`/api/cleaners/${selectedCleanerId}/link`, {
        method: "POST",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to generate link");
      }
      await refreshCleaners();
    } catch (err) {
      throw err;
    }
  };

  const handleRefreshLink = async () => {
    if (!selectedCleanerId) return;
    try {
      const response = await fetch(`/api/cleaners/${selectedCleanerId}/link`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to refresh link");
      }
      await refreshCleaners();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedCleanerId) return;
    try {
      const response = await fetch(`/api/cleaners/${selectedCleanerId}/link`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? "Unable to delete link");
      }
      await refreshCleaners();
    } catch (err) {
      throw err;
    }
  };

  const handleSelectCleaner = (cleaner: CleanerWithAssignments) => {
    setSelectedCleanerId(cleaner.id);
    if (isMobile) {
      setDetailsPanelOpen(true);
    }
  };

  const selectedCleaner =
    cleaners.find((c) => c.id === selectedCleanerId) || null;

  return (
    <AppShell email={email} userName={userName}>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#EFF6E0]">Cleaners</h2>
            <p className="mt-1 text-base text-[#EFF6E0]/70">
              Track everyone who keeps your properties spotless.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {/* Split View Layout */}
        <div className="relative flex flex-1 overflow-hidden rounded-2xl border border-[#124559]/40 bg-[#01161E]/40 shadow-lg">
          {/* Left Panel - Cleaner List */}
          <div className="w-full shrink-0 lg:w-80 xl:w-96">
            <CleanerListSidebar
              cleaners={cleaners}
              selectedCleanerId={selectedCleanerId}
              onSelectCleaner={handleSelectCleaner}
              onAddCleaner={() => setAddModalOpen(true)}
            />
          </div>

          {/* Divider */}
          <div className="hidden w-px shrink-0 bg-[#124559]/40 lg:block" />

          {/* Right Panel - Cleaner Details */}
          <div className="hidden flex-1 lg:block">
            <div className="h-full transition-opacity duration-200">
              <CleanerDetailsPanel
                cleaner={selectedCleaner}
                onClose={() => setSelectedCleanerId(null)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onGenerateLink={handleGenerateLink}
                onRefreshLink={handleRefreshLink}
                onDeleteLink={handleDeleteLink}
              />
            </div>
          </div>

          {/* Mobile Drawer */}
          {isMobile && detailsPanelOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setDetailsPanelOpen(false)}
              />
              {/* Drawer */}
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#01161E] shadow-2xl lg:hidden">
                <CleanerDetailsPanel
                  cleaner={selectedCleaner}
                  onClose={() => {
                    setDetailsPanelOpen(false);
                    setSelectedCleanerId(null);
                  }}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onGenerateLink={handleGenerateLink}
                  onRefreshLink={handleRefreshLink}
                  onDeleteLink={handleDeleteLink}
                  isMobile={true}
                />
              </div>
            </>
          )}
        </div>
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
    </AppShell>
  );
}
