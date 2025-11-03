"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";

export type PropertyPayload = {
  name: string;
  ical_url: string;
  checkout_time?: string;
  cleaner?: string;
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
      checkout_time: "10:00",
      cleaner: "",
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
        // Silently fail - user can still type new names
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

    if (!formState.name || !formState.ical_url) {
      setError("Please provide both a property name and an iCal URL.");
      return;
    }

    // Validate checkout_time format if provided
    if (formState.checkout_time) {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(formState.checkout_time)) {
        setError("Checkout time must be in HH:MM format (e.g., 10:00).");
        return;
      }
    }

    try {
      await onSubmit(formState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save property.");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="property-name"
        >
          Property name
        </label>
        <input
          id="property-name"
          placeholder="Manchester Apartment"
          value={formState.name}
          onChange={handleChange("name")}
          required
          className="w-full rounded-lg border border-[#124559]/50 bg-white px-4 py-2.5 text-sm text-[#01161E] placeholder:text-[#01161E]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="property-ical"
        >
          iCal feed URL
        </label>
        <input
          id="property-ical"
          placeholder="https://.../calendar.ics"
          value={formState.ical_url}
          onChange={handleChange("ical_url")}
          required
          className="w-full rounded-lg border border-[#124559]/50 bg-white px-4 py-2.5 text-sm text-[#01161E] placeholder:text-[#01161E]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="checkout-time"
        >
          Standard Checkout Time
        </label>
        <input
          id="checkout-time"
          type="time"
          value={formState.checkout_time || "10:00"}
          onChange={handleChange("checkout_time")}
          placeholder="10:00"
          className="w-full rounded-lg border border-[#124559]/50 bg-white px-4 py-2.5 text-sm text-[#01161E] placeholder:text-[#01161E]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200 [color-scheme:light]"
        />
        <p className="text-xs text-[#EFF6E0]/50">
          Default checkout time for cleans from this property (e.g., 10:00 for
          10 AM)
        </p>
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="cleaner"
        >
          Cleaner
        </label>
        <div className="relative z-50">
          <input
            id="cleaner"
            placeholder="Enter cleaner name"
            value={formState.cleaner || ""}
            onChange={(e) => {
              handleChange("cleaner")(e);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking on them
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className="w-full rounded-lg border border-[#124559]/50 bg-white px-4 py-2.5 text-sm text-[#01161E] placeholder:text-[#01161E]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-[100] w-full mt-1 bg-white border border-[#124559]/50 rounded-lg shadow-xl max-h-60 overflow-auto">
              {filteredSuggestions.map((cleaner, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-[#598392]/20 cursor-pointer text-sm text-[#01161E] transition-colors duration-200"
                  onMouseDown={(e) => {
                    e.preventDefault();
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
          Assign a cleaner to this property. Existing cleaners will appear as
          suggestions.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2.5 text-sm font-medium text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Saving..." : "Save property"}
        </button>
      </div>
    </form>
  );
}
