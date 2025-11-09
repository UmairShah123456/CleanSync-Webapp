"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AddPropertyModal } from "./components/AddPropertyModal";
import { PropertyListSidebar } from "./components/PropertyListSidebar";
import { PropertyDetailsPanel } from "./components/PropertyDetailsPanel";
import type { Property } from "./components/PropertyList";
import type { PropertyPayload } from "@/components/forms/PropertyForm";

export function PropertiesClient({
  email,
  initialProperties,
}: {
  email?: string | null;
  initialProperties: Property[];
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  // Remember last selected property from localStorage
  useEffect(() => {
    if (properties.length === 0) return;

    const saved = localStorage.getItem("lastSelectedPropertyId");
    if (saved && properties.some((p) => p.id === saved)) {
      setSelectedPropertyId(saved);
    } else if (!selectedPropertyId) {
      // Auto-select first property if none selected
      setSelectedPropertyId(properties[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length]);

  // Save selected property to localStorage
  useEffect(() => {
    if (selectedPropertyId) {
      localStorage.setItem("lastSelectedPropertyId", selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const property = properties.find((p) => p.id === id);
    const propertyName = property?.name || "this property";

    if (
      !confirm(
        `Are you sure you want to delete "${propertyName}"? This action cannot be undone and will remove all associated cleans and bookings.`
      )
    ) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const { error: message } = await response.json();
      const errorMessage = message ?? "Unable to delete property";
      setError(errorMessage);
      throw new Error(errorMessage);
    } else {
      setProperties((prev) => prev.filter((property) => property.id !== id));
      if (selectedPropertyId === id) {
        setSelectedPropertyId(null);
        if (isMobile) {
          setDetailsPanelOpen(false);
        }
      }
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

  const handleSelectProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
    if (isMobile) {
      setDetailsPanelOpen(true);
    }
  };

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || null;

  return (
    <AppShell email={email}>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#EFF6E0]">
              Properties
            </h2>
            <p className="mt-1 text-base text-[#EFF6E0]/70">
              Manage each rental and its connected calendar feed.
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
          {/* Left Panel - Property List */}
          <div className="w-full shrink-0 lg:w-80 xl:w-96">
            <PropertyListSidebar
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={handleSelectProperty}
              onAddProperty={() => setModalOpen(true)}
            />
          </div>

          {/* Divider */}
          <div className="hidden w-px shrink-0 bg-[#124559]/40 lg:block" />

          {/* Right Panel - Property Details */}
          <div className="hidden flex-1 lg:block">
            <div className="h-full transition-opacity duration-200">
              <PropertyDetailsPanel
                property={selectedProperty}
                onClose={() => setSelectedPropertyId(null)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
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
                <PropertyDetailsPanel
                  property={selectedProperty}
                  onClose={() => {
                    setDetailsPanelOpen(false);
                    setSelectedPropertyId(null);
                  }}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isMobile={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <AddPropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </AppShell>
  );
}
