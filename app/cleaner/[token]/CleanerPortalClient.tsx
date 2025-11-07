"use client";

import type {
  ScheduleClean,
  ScheduleProperty,
  ScheduleRange,
} from "@/app/schedule/types";
import { ScheduleClient } from "@/app/schedule/ScheduleClient";
import { LanguageProvider, useLanguage } from "@/lib/contexts/LanguageContext";
import { LanguageSelector } from "@/components/cleaner/LanguageSelector";

export type CleanerPortalClientProps = {
  token: string;
  cleaner: {
    name: string;
    cleaner_type: "individual" | "company";
    phone?: string | null;
    notes?: string | null;
    payment_details?: string | null;
  };
  properties: ScheduleProperty[];
  initialCleans: ScheduleClean[];
  initialRange: ScheduleRange;
};

function CleanerPortalContent({
  token,
  cleaner,
  properties,
  initialCleans,
  initialRange,
}: CleanerPortalClientProps) {
  const { t } = useLanguage();
  const isCompany = cleaner.cleaner_type === "company";
  const description = isCompany
    ? t.descriptionCompany
    : t.descriptionIndividual;

  return (
    <div className="min-h-screen bg-[#01161E] text-[#EFF6E0]">
      <div className="mx-auto w-full max-w-screen space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 md:px-8 md:py-10">
        <header className="rounded-2xl border border-[#124559]/60 bg-gradient-to-br from-[#021b27] via-[#01161E] to-[#0b3141] p-4 shadow-2xl shadow-[#01161E]/80 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-[#EFF6E0] sm:text-2xl">
                  {cleaner.name}
                </h1>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#EFF6E0]/70 sm:text-xs sm:tracking-[0.3em]">
                  {isCompany ? t.cleaningCompany : t.individualCleaner}
                </p>
              </div>
              <div className="shrink-0">
                <LanguageSelector />
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-[#EFF6E0]/70 sm:text-sm">
              {cleaner.phone ? (
                <p className="break-words">
                  <span className="font-medium">{t.phone}:</span>{" "}
                  <a
                    href={`tel:${cleaner.phone}`}
                    className="text-[#598392] underline hover:text-[#85C7BF]"
                  >
                    {cleaner.phone}
                  </a>
                </p>
              ) : null}
              {cleaner.notes ? (
                <p className="break-words">
                  <span className="font-medium">{t.notes}:</span>{" "}
                  {cleaner.notes}
                </p>
              ) : null}
              {cleaner.payment_details ? (
                <p className="break-words">
                  <span className="font-medium">{t.payment}:</span>{" "}
                  {cleaner.payment_details}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-[#124559]/50 bg-[#01161E]/60 p-3 text-xs text-[#EFF6E0]/70 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <p className="leading-relaxed">{description}</p>
            <div className="flex flex-wrap gap-1.5 pt-2 sm:gap-2">
              {properties.length ? (
                properties.map((property) => (
                  <span
                    key={property.id}
                    className="rounded-full border border-[#598392]/40 bg-[#124559]/40 px-2.5 py-1 text-[0.65rem] font-semibold text-[#EFF6E0]/80 sm:px-3 sm:text-xs"
                  >
                    {property.name}
                  </span>
                ))
              ) : (
                <span className="text-[0.65rem] text-[#EFF6E0]/50 sm:text-xs">
                  {t.noPropertiesAssigned}
                </span>
              )}
            </div>
          </div>
        </header>

        <ScheduleClient
          properties={properties}
          initialCleans={initialCleans}
          initialRange={initialRange}
          fetchUrlBuilder={(range, propertyId) => {
            const params = new URLSearchParams({
              from: range.from,
              to: range.to,
            });
            if (propertyId) {
              params.append("property_id", propertyId);
            }
            return `/api/cleaner-links/${token}/schedule?${params.toString()}`;
          }}
          title={t.schedule}
          description=""
          portalContext={{
            type: "cleaner",
            cleanerType: cleaner.cleaner_type,
            token,
          }}
          translations={t}
        />
      </div>
    </div>
  );
}

export function CleanerPortalClient(props: CleanerPortalClientProps) {
  return (
    <LanguageProvider>
      <CleanerPortalContent {...props} />
    </LanguageProvider>
  );
}
