"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type PropertyPayload = {
  name: string;
  ical_url: string;
};

export function PropertyForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: PropertyPayload;
  onSubmit: (payload: PropertyPayload) => Promise<void>;
  submitting?: boolean;
}) {
  const [formState, setFormState] = useState<PropertyPayload>(
    initial ?? {
      name: "",
      ical_url: "",
    }
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof PropertyPayload) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formState.name || !formState.ical_url) {
      setError("Please provide both a property name and an iCal URL.");
      return;
    }

    try {
      await onSubmit(formState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save property.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="property-name">
          Property name
        </label>
        <Input
          id="property-name"
          placeholder="Manchester Apartment"
          value={formState.name}
          onChange={handleChange("name")}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="property-ical">
          iCal feed URL
        </label>
        <Input
          id="property-ical"
          placeholder="https://.../calendar.ics"
          value={formState.ical_url}
          onChange={handleChange("ical_url")}
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end gap-3">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save property"}
        </Button>
      </div>
    </form>
  );
}
