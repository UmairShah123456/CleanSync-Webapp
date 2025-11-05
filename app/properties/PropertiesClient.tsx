"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { AddPropertyModal } from "./components/AddPropertyModal";
import { PropertyList, type Property } from "./components/PropertyList";
import type { PropertyPayload } from "@/components/forms/PropertyForm";

export function PropertiesClient({
  email,
  initialProperties,
}: {
  email?: string | null;
  initialProperties: Property[];
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProperties = async () => {
    const response = await fetch("/api/properties", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load properties");
    }
    const data = (await response.json()) as Property[];
    setProperties(data);
  };

  const handleCreate = async (payload: PropertyPayload) => {
    setError(null);
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const { error: message } = await response.json();
      throw new Error(message ?? "Unable to create property");
    }

    await refreshProperties();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const response = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const { error: message } = await response.json();
      const errorMessage = message ?? "Unable to delete property";
      setError(errorMessage);
      throw new Error(errorMessage);
    } else {
      setProperties((prev) => prev.filter((property) => property.id !== id));
    }
  };

  const handleUpdate = async (id: string, payload: PropertyPayload) => {
    setError(null);
    const response = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const { error: message } = await response.json();
      throw new Error(message ?? "Unable to update property");
    }

    await refreshProperties();
  };

  const handleSync = async (id: string) => {
    setError(null);
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: id }),
    });

    if (!response.ok) {
      const { error: message } = await response.json();
      setError(message ?? "Unable to sync property");
    }
  };

  return (
    <AppShell email={email}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#EFF6E0]">Properties</h2>
          <p className="mt-1 text-base text-[#EFF6E0]/70">
            Manage each rental and its connected calendar feed.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2 text-sm font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg"
        >
          Add property
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <PropertyList
        properties={properties}
        onDelete={handleDelete}
        onSync={handleSync}
        onUpdate={handleUpdate}
      />

      <AddPropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </AppShell>
  );
}
