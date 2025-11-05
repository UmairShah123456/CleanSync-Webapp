"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

export type CleanerPayload = {
  name: string;
  phone?: string | null;
  notes?: string | null;
  payment_details?: string | null;
  cleaner_type: "individual" | "company";
};

const COUNTRIES = [
  { code: "GB", name: "United Kingdom", dial: "+44", minLength: 10, maxLength: 10 },
  { code: "US", name: "United States", dial: "+1", minLength: 10, maxLength: 10 },
  { code: "IE", name: "Ireland", dial: "+353", minLength: 9, maxLength: 9 },
  { code: "ES", name: "Spain", dial: "+34", minLength: 9, maxLength: 9 },
  { code: "FR", name: "France", dial: "+33", minLength: 9, maxLength: 9 },
  { code: "AE", name: "United Arab Emirates", dial: "+971", minLength: 9, maxLength: 9 },
];

export function CleanerForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
  onDelete,
  deleting,
}: {
  initial?: CleanerPayload;
  onSubmit: (payload: CleanerPayload) => Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  deleting?: boolean;
}) {
  const [formState, setFormState] = useState<CleanerPayload>(
    initial ?? {
      name: "",
      phone: "",
      notes: "",
      payment_details: "",
      cleaner_type: "individual",
    }
  );
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      const sanitizedPhone = initial.phone?.replace(/\s+/g, "") ?? "";
      const matchedCountry =
        COUNTRIES.find((country) => sanitizedPhone.startsWith(country.dial)) ??
        COUNTRIES[0];
      const localDigits = sanitizedPhone
        .replace(matchedCountry.dial, "")
        .replace(/\D/g, "");

      setSelectedCountry(matchedCountry);
      setFormState({
        name: initial.name ?? "",
        phone: localDigits,
        notes: initial.notes ?? "",
        payment_details: initial.payment_details ?? "",
        cleaner_type:
          initial.cleaner_type === "company" ? "company" : "individual",
      });
    } else {
      setSelectedCountry(COUNTRIES[0]);
      setFormState({
        name: "",
        phone: "",
        notes: "",
        payment_details: "",
        cleaner_type: "individual",
      });
    }
  }, [initial]);

  const handleChange =
    (field: keyof CleanerPayload) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (field === "phone") {
        const digits = event.target.value.replace(/\D/g, "");
        setFormState((prev) => ({
          ...prev,
          phone: digits,
        }));
        return;
      }
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formState.name.trim()) {
      setError("Cleaner name is required.");
      return;
    }

    const digitsOnly = formState.phone?.replace(/\D/g, "") ?? "";
    const selected = selectedCountry;

    if (digitsOnly && (digitsOnly.length < selected.minLength || digitsOnly.length > selected.maxLength)) {
      setError(
        `Phone number must be ${selected.minLength}${
          selected.minLength !== selected.maxLength
            ? `-${selected.maxLength}`
            : ""
        } digits for ${selected.name}.`
      );
      return;
    }

    if (
      !formState.cleaner_type ||
      !["individual", "company"].includes(formState.cleaner_type)
    ) {
      setError("Cleaner type must be set to Individual or Company.");
      return;
    }

    try {
      await onSubmit({
        ...formState,
        name: formState.name.trim(),
        phone: digitsOnly
          ? `${selected.dial}${digitsOnly}`
          : null,
        notes: formState.notes?.trim() || null,
        payment_details: formState.payment_details?.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save cleaner.");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#EFF6E0]/60">
          Cleaner Details
        </p>
        <p className="mt-2 text-sm text-[#EFF6E0]/60">
          Keep track of your individual cleaners and partner companies, along
          with their contact and payment information.
        </p>
      </section>

      <div className="space-y-5">
        <div className="space-y-2">
          <label
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="cleaner-name"
          >
            <span>Cleaner name</span>
            <span className="rounded-full bg-[#124559]/50 px-2 py-0.5 text-[0.6rem] font-semibold text-[#EFF6E0]/70">
              Required
            </span>
          </label>
          <input
            id="cleaner-name"
            placeholder="e.g. Sarah Jenkins"
            value={formState.name}
            onChange={handleChange("name")}
            required
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
            Cleaner type
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "individual", label: "Individual cleaner" },
              { value: "company", label: "Cleaning company" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex-1 min-w-[160px] cursor-pointer rounded-xl border px-4 py-3 text-sm transition-colors duration-200 ${
                  formState.cleaner_type === option.value
                    ? "border-[#598392] bg-[#124559]/50 text-[#EFF6E0]"
                    : "border-[#124559]/60 bg-[#01161E]/70 text-[#EFF6E0]/70 hover:border-[#598392]/60 hover:text-[#EFF6E0]"
                }`}
              >
                <input
                  type="radio"
                  name="cleaner-type"
                  value={option.value}
                  checked={formState.cleaner_type === option.value}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      cleaner_type: event.target.value as CleanerPayload["cleaner_type"],
                    }))
                  }
                  className="hidden"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{option.label}</span>
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      formState.cleaner_type === option.value
                        ? "border-[#9AD1D4] bg-[#9AD1D4]"
                        : "border-[#598392]/50"
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
            Phone number
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-60">
              <select
                value={selectedCountry.code}
                onChange={(event) => {
                  const next = COUNTRIES.find(
                    (country) => country.code === event.target.value
                  );
                  if (next) {
                    setSelectedCountry(next);
                  }
                }}
                className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.dial})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div className="flex rounded-xl border border-[#124559]/60 bg-[#01161E]/70">
                <span className="flex items-center px-3 text-sm font-semibold text-[#EFF6E0]/80">
                  {selectedCountry.dial}
                </span>
                <input
                  id="cleaner-phone"
                  value={formState.phone ?? ""}
                  onChange={handleChange("phone")}
                  placeholder="7000000000"
                  inputMode="numeric"
                  className="h-full flex-1 rounded-r-xl bg-transparent px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-[#EFF6E0]/50">
                Enter{" "}
                {selectedCountry.minLength === selectedCountry.maxLength
                  ? `${selectedCountry.minLength}`
                  : `${selectedCountry.minLength}-${selectedCountry.maxLength}`}{" "}
                digits for {selectedCountry.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="cleaner-notes"
          >
            Notes
          </label>
          <textarea
            id="cleaner-notes"
            rows={3}
            placeholder="Add any preferences, strengths, or reminders for this cleaner."
            value={formState.notes ?? ""}
            onChange={handleChange("notes")}
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60"
            htmlFor="cleaner-payment"
          >
            Payment details
          </label>
          <textarea
            id="cleaner-payment"
            rows={3}
            placeholder="Bank account, preferred payment method, or rate notes."
            value={formState.payment_details ?? ""}
            onChange={handleChange("payment_details")}
            className="w-full rounded-xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/40 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60 transition-colors duration-200"
          />
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
            {deleting ? "Deleting..." : "Delete cleaner"}
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
            {submitting ? "Saving..." : "Save cleaner"}
          </button>
        </div>
      </div>
    </form>
  );
}
