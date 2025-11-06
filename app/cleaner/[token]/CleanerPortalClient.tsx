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
      <div className="mx-auto w-full max-w-screen space-y-8 px-4 py-10 md:px-8">
        <header className="rounded-3xl border border-[#124559]/60 bg-gradient-to-br from-[#021b27] via-[#01161E] to-[#0b3141] p-6 shadow-2xl shadow-[#01161E]/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#EFF6E0]">
                {cleaner.name}
              </h1>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#EFF6E0]/70">
                {isCompany ? t.cleaningCompany : t.individualCleaner}
              </p>
              <div className="mt-3 space-y-1 text-sm text-[#EFF6E0]/70">
                {cleaner.phone ? (
                  <p>
                    {t.phone}: {cleaner.phone}
                  </p>
                ) : null}
                {cleaner.notes ? (
                  <p>
                    {t.notes}: {cleaner.notes}
                  </p>
                ) : null}
                {cleaner.payment_details ? (
                  <p>
                    {t.payment}: {cleaner.payment_details}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <LanguageSelector />
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl border border-[#124559]/50 bg-[#01161E]/60 px-4 py-3 text-sm text-[#EFF6E0]/70">
            <p>{description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {properties.length ? (
                properties.map((property) => (
                  <span
                    key={property.id}
                    className="rounded-full border border-[#598392]/40 bg-[#124559]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80"
                  >
                    {property.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#EFF6E0]/50">
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
