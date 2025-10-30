"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type FilterState = {
  propertyId?: string;
  status?: string;
  from?: string;
  to?: string;
};

export function FilterForm({
  properties,
  onChange,
  onReset,
}: {
  properties: { id: string; name: string }[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}) {
  const [filters, setFilters] = useState<FilterState>({});

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const updateFilters = (updater: (prev: FilterState) => FilterState) => {
    setFilters((prev) => {
      const next = updater(prev);
      onChange(next);
      return next;
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex w-full flex-col gap-2 sm:w-48">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Property
        </label>
        <Select
          value={filters.propertyId ?? ""}
          onChange={(event) =>
            updateFilters((prev) => ({
              ...prev,
              propertyId: event.target.value || undefined,
            }))
          }
        >
          <option value="">All properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-40">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Status
        </label>
        <Select
          value={filters.status ?? ""}
          onChange={(event) =>
            updateFilters((prev) => ({
              ...prev,
              status: event.target.value || undefined,
            }))
          }
        >
          <option value="">Any status</option>
          <option value="scheduled">Scheduled</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-40">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          From
        </label>
        <Input
          type="date"
          value={filters.from ?? ""}
          onChange={(event) =>
            updateFilters((prev) => ({
              ...prev,
              from: event.target.value || undefined,
            }))
          }
        />
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-40">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          To
        </label>
        <Input
          type="date"
          value={filters.to ?? ""}
          onChange={(event) =>
            updateFilters((prev) => ({
              ...prev,
              to: event.target.value || undefined,
            }))
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
