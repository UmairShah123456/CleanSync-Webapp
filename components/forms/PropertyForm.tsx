"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

export type PropertyPayload = {
  name: string;
  ical_url: string;
  checkout_time: string;
  cleaner?: string;
  management_type?: "self-managed" | "company-managed";
};

export function PropertyForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
  onDelete,
  deleting,
}: {
  initial?: PropertyPayload;
  onSubmit: (payload: PropertyPayload) => Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  deleting?: boolean;
}) {
  const [formState, setFormState] = useState<PropertyPayload>(
    initial ?? {
      name: "",
      ical_url: "",
      checkout_time: "10:00",
      cleaner: "",
      management_type: "self-managed",
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [existingCleaners, setExistingCleaners] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Fetch existing cleaners on mount
  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        const response = await fetch("/api/cleaners");
        if (response.ok) {
          const cleaners = await response.json();
          setExistingCleaners(cleaners);
        }
      } catch (err) {
        console.error("Failed to fetch cleaners:", err);
      }
    };
    fetchCleaners();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (formState.cleaner && showSuggestions) {
      const input = formState.cleaner.toLowerCase().trim();
      const filtered = existingCleaners.filter((cleaner) =>
        cleaner.toLowerCase().includes(input)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [formState.cleaner, existingCleaners, showSuggestions]);

  const handleChange =
    (field: keyof PropertyPayload) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (
      !formState.name ||
      !formState.ical_url ||
      !formState.checkout_time ||
      !formState.management_type
    ) {
      setError(
        "Please provide a property name, iCal URL, checkout time, and management type."
      );
      return;
    }

    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(formState.checkout_time)) {
      setError("Checkout time must be in HH:MM format (e.g., 10:00).");
      return;
    }

    try {
      await onSubmit(formState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save property.");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#EFF6E0]/60">
          Property Details
        </p>
        <p className="mt-2 text-sm text-[#EFF6E0]/60">
          Connect the reservation feed, standard checkout window, and the
          cleaner responsible for turnovers so CleanSync can automate your
          schedule.
        </p>
      </section>

      <div className="space-y-5">
        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="property-name"
          >
            <span>Property name</span>
            <span className="rounded-full bg-[#124559]/50 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/70">
              Required
            </span>
          </label>
          <input
            id="property-name"
            placeholder="Manchester Apartment"
            value={formState.name}
            onChange={handleChange("name")}
            required
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="management-type-self"
          >
            <span>Management type</span>
            <span className="rounded-full bg-[#124559]/50 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/70">
              Required
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "self-managed", label: "Self-managed" },
              { value: "company-managed", label: "Company-managed" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex-1 min-w-[140px] cursor-pointer rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0]/80 transition-colors duration-200 hover:border-[#598392]/60"
              >
                <input
                  id={
                    option.value === "self-managed"
                      ? "management-type-self"
                      : "management-type-company"
                  }
                  type="radio"
                  name="management-type"
                  value={option.value}
                  checked={formState.management_type === option.value}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      management_type:
                        event.target.value as PropertyPayload["management_type"],
                    }))
                  }
                  className="hidden"
                  required
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#EFF6E0]">
                    {option.label}
                  </span>
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      formState.management_type === option.value
                        ? "border-[#9AD1D4] bg-[#9AD1D4]"
                        : "border-[#598392]/50"
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#EFF6E0]/50">
            Choose whether you or a partner company manages this property.
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="property-ical"
          >
            <span>iCal feed URL</span>
            <span className="rounded-full bg-[#124559]/50 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/70">
              Required
            </span>
          </label>
          <input
            id="property-ical"
            placeholder="https://.../calendar.ics"
            value={formState.ical_url}
            onChange={handleChange("ical_url")}
            required
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="checkout-time"
          >
            <span>Standard checkout time</span>
            <span className="rounded-full bg-[#124559]/50 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/70">
              Required
            </span>
          </label>
          <input
            id="checkout-time"
            type="time"
            value={formState.checkout_time}
            onChange={handleChange("checkout_time")}
            required
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
          <p className="text-xs text-[#EFF6E0]/50">
            We use this time to schedule cleans after checkout. Adjust if a
            property has a different turnover window.
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="cleaner"
          >
            <span>Cleaner</span>
            <span className="rounded-full bg-[#124559]/40 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/60">
              Optional
            </span>
          </label>
          <div className="relative z-50">
            <input
              id="cleaner"
              placeholder="Enter cleaner name"
              value={formState.cleaner || ""}
              onChange={(event) => {
                handleChange("cleaner")(event);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute z-[100] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[#124559]/60 bg-[#01161E]/95 shadow-2xl shadow-[#01161E]/60 backdrop-blur">
                {filteredSuggestions.map((cleaner, index) => (
                  <li
                    key={index}
                    className="cursor-pointer px-4 py-2 text-sm text-[#EFF6E0] transition-colors duration-200 hover:bg-[#124559]/50"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setFormState((prev) => ({ ...prev, cleaner }));
                      setShowSuggestions(false);
                    }}
                  >
                    {cleaner}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-[#EFF6E0]/50">
            Assign a cleaner to surface their schedule on dashboards. Start
            typing to reuse an existing name.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || submitting}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition-all duration-200 hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete property"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting || deleting}
              className="rounded-full border border-[#124559]/50 px-5 py-2.5 text-sm font-semibold text-[#EFF6E0]/70 transition-colors duration-200 hover:border-[#598392]/60 hover:text-[#EFF6E0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={submitting || deleting}
            className="rounded-full bg-gradient-to-r from-[#124559] to-[#598392] px-5 py-2.5 text-sm font-semibold text-[#EFF6E0] shadow-lg shadow-[#01161E]/50 transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save property"}
          </button>
        </div>
      </div>
    </form>
  );
}
