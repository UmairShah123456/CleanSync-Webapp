"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";

type CleanerPortalProps = {
  token: string;
  cleaner: {
    name: string;
    cleaner_type: "individual" | "company";
    phone?: string | null;
    notes?: string | null;
    payment_details?: string | null;
  };
  properties: {
    id: string;
    name: string;
    notes: string | null;
    checkout_time: string | null;
  }[];
  cleans: {
    id: string;
    property_id: string;
    scheduled_for: string;
    status: string;
    notes: string | null;
  }[];
};

type LanguageKey = "en" | "pl" | "pt-br" | "ro" | "es";

const LANGUAGE_OPTIONS: { value: LanguageKey; label: string; locale: string }[] = [
  { value: "en", label: "English", locale: "en-GB" },
  { value: "pl", label: "Polski", locale: "pl-PL" },
  { value: "pt-br", label: "Português (Brasil)", locale: "pt-BR" },
  { value: "ro", label: "Română", locale: "ro-RO" },
  { value: "es", label: "Español", locale: "es-ES" },
];

const STRINGS: Record<LanguageKey, Record<string, string>> = {
  en: {
    schedule: "Schedule",
    language: "Language",
    readOnly: "This company link is read-only. You can review every scheduled clean for the properties assigned to your team.",
    interactive:
      "You can mark cleans as complete and review every property assigned to you.",
    markComplete: "Mark as complete",
    completing: "Completing...",
    completed: "Completed",
    noCleans: "No cleans scheduled yet.",
    notes: "Notes",
    payment: "Payment details",
    phone: "Phone",
    assignment: "Assigned properties",
    propertyNotes: "Property notes",
    checkout: "Standard checkout",
    cleanNotes: "Clean notes",
    confirmComplete: "Mark this clean as complete?",
    successComplete: "Clean marked as complete.",
  },
  pl: {
    schedule: "Harmonogram",
    language: "Język",
    readOnly:
      "Ten link dla firmy jest tylko do odczytu. Możesz przejrzeć wszystkie sprzątania przypisane do Twojego zespołu.",
    interactive:
      "Możesz oznaczać sprzątania jako zakończone i przeglądać wszystkie przypisane nieruchomości.",
    markComplete: "Oznacz jako zakończone",
    completing: "Oznaczanie...",
    completed: "Zakończone",
    noCleans: "Brak zaplanowanych sprzątań.",
    notes: "Notatki",
    payment: "Dane płatności",
    phone: "Telefon",
    assignment: "Przypisane nieruchomości",
    propertyNotes: "Notatki o nieruchomości",
    checkout: "Standardowa godzina wymeldowania",
    cleanNotes: "Notatki do sprzątania",
    confirmComplete: "Oznaczyć to sprzątanie jako zakończone?",
    successComplete: "Sprzątanie oznaczone jako zakończone.",
  },
  "pt-br": {
    schedule: "Agenda",
    language: "Idioma",
    readOnly:
      "Este link da empresa é somente leitura. Você pode ver todas as limpezas agendadas para suas propriedades.",
    interactive:
      "Você pode marcar limpezas como concluídas e revisar todas as propriedades atribuídas a você.",
    markComplete: "Marcar como concluído",
    completing: "Concluindo...",
    completed: "Concluído",
    noCleans: "Nenhuma limpeza agendada.",
    notes: "Observações",
    payment: "Detalhes de pagamento",
    phone: "Telefone",
    assignment: "Propriedades atribuídas",
    propertyNotes: "Observações da propriedade",
    checkout: "Checkout padrão",
    cleanNotes: "Observações da limpeza",
    confirmComplete: "Marcar esta limpeza como concluída?",
    successComplete: "Limpeza marcada como concluída.",
  },
  ro: {
    schedule: "Program",
    language: "Limbă",
    readOnly:
      "Acest link pentru firmă este doar pentru vizualizare. Poți vedea toate curățeniile programate pentru proprietățile tale.",
    interactive:
      "Poți marca curățeniile ca finalizate și poți vedea toate proprietățile alocate ție.",
    markComplete: "Marchează ca finalizat",
    completing: "Se marchează...",
    completed: "Finalizat",
    noCleans: "Nu există curățenii programate.",
    notes: "Notițe",
    payment: "Detalii plată",
    phone: "Telefon",
    assignment: "Proprietăți alocate",
    propertyNotes: "Notițe despre proprietate",
    checkout: "Ora standard de check-out",
    cleanNotes: "Notițe despre curățenie",
    confirmComplete: "Marchezi această curățenie ca finalizată?",
    successComplete: "Curățenia a fost marcată ca finalizată.",
  },
  es: {
    schedule: "Agenda",
    language: "Idioma",
    readOnly:
      "Este enlace de empresa es de solo lectura. Puedes revisar todas las limpiezas programadas para tus propiedades asignadas.",
    interactive:
      "Puedes marcar limpiezas como completadas y revisar todas las propiedades asignadas.",
    markComplete: "Marcar como completado",
    completing: "Marcando...",
    completed: "Completado",
    noCleans: "No hay limpiezas programadas.",
    notes: "Notas",
    payment: "Detalles de pago",
    phone: "Teléfono",
    assignment: "Propiedades asignadas",
    propertyNotes: "Notas de la propiedad",
    checkout: "Salida estándar",
    cleanNotes: "Notas de la limpieza",
    confirmComplete: "¿Marcar esta limpieza como completada?",
    successComplete: "Limpieza marcada como completada.",
  },
};

export function CleanerPortalClient({
  token,
  cleaner,
  properties,
  cleans,
}: CleanerPortalProps) {
  const [language, setLanguage] = useState<LanguageKey>("en");
  const [localCleans, setLocalCleans] = useState(cleans);
  const [isPending, startTransition] = useTransition();

  const strings = STRINGS[language];
  const locale = LANGUAGE_OPTIONS.find((option) => option.value === language)
    ?.locale as string;

  const groupedCleans = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return localCleans.reduce<Record<string, typeof localCleans>>((acc, clean) => {
      const date = new Date(clean.scheduled_for);
      const key = date.toISOString().split("T")[0];
      const label = formatter.format(date);
      if (!acc[key]) {
        acc[key] = [] as any;
        (acc[key] as any).label = label;
      }
      acc[key].push(clean);
      return acc;
    }, {});
  }, [localCleans, locale]);

  const propertyLookup = useMemo(() => {
    return new Map(properties.map((property) => [property.id, property]));
  }, [properties]);

  const handleComplete = (cleanId: string) => {
    if (!confirm(STRINGS[language].confirmComplete)) return;
    startTransition(async () => {
      const response = await fetch(`/api/cleaner-links/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clean_id: cleanId }),
      });
      if (response.ok) {
        setLocalCleans((prev) =>
          prev.map((clean) =>
            clean.id === cleanId ? { ...clean, status: "completed" } : clean
          )
        );
        alert(STRINGS[language].successComplete);
      } else {
        const { error } = await response.json();
        alert(error ?? "Unable to mark clean as complete.");
      }
    });
  };

  const isCompany = cleaner.cleaner_type === "company";

  return (
    <div className="min-h-screen bg-[#01161E] text-[#EFF6E0]">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
        <header className="rounded-3xl border border-[#124559]/60 bg-gradient-to-br from-[#021b27] via-[#01161E] to-[#0b3141] p-6 shadow-2xl shadow-[#01161E]/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#EFF6E0]">
                {cleaner.name}
              </h1>
              <p className="mt-1 text-sm uppercase tracking-[0.3em] text-[#EFF6E0]/70">
                {isCompany ? "Cleaning company" : "Individual cleaner"}
              </p>
              <div className="mt-3 space-y-1 text-sm text-[#EFF6E0]/70">
                {cleaner.phone ? <p>{strings.phone}: {cleaner.phone}</p> : null}
                {cleaner.notes ? <p>{strings.notes}: {cleaner.notes}</p> : null}
                {cleaner.payment_details ? (
                  <p>{strings.payment}: {cleaner.payment_details}</p>
                ) : null}
              </div>
            </div>
            {!isCompany ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-[#124559]/60 bg-[#01161E]/70 px-4 py-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
                  {strings.language}
                </label>
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as LanguageKey)
                  }
                  className="rounded-xl border border-[#124559]/60 bg-[#01161E]/90 px-3 py-2 text-sm text-[#EFF6E0] focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392]/60"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <p className="mt-4 rounded-2xl border border-[#124559]/50 bg-[#01161E]/60 px-4 py-3 text-sm text-[#EFF6E0]/70">
            {isCompany ? strings.readOnly : strings.interactive}
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#124559]/40 bg-[#01161E]/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/60">
            {strings.assignment}
          </p>
          {properties.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {properties.map((property) => (
                <span
                  key={property.id}
                  className="rounded-full border border-[#598392]/40 bg-[#124559]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80"
                >
                  {property.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#EFF6E0]/50">—</p>
          )}
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-[#EFF6E0]">
            {strings.schedule}
          </h2>
          {Object.keys(groupedCleans).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#598392]/30 bg-[#124559]/40 p-10 text-center text-sm text-[#EFF6E0]/70">
              {strings.noCleans}
            </div>
          ) : (
            Object.entries(groupedCleans).map(([dateKey, cleansForDay]) => (
              <div
                key={dateKey}
                className="space-y-4 rounded-2xl border border-[#124559]/40 bg-[#01161E]/60 p-5"
              >
                <h3 className="text-base font-semibold text-[#EFF6E0]">
                  {(cleansForDay as any).label}
                </h3>
                <div className="space-y-3">
                  {cleansForDay.map((clean) => {
                    const property = propertyLookup.get(clean.property_id);
                    const date = new Date(clean.scheduled_for);
                    const time = new Intl.DateTimeFormat(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(date);
                    const completed = clean.status === "completed";
                    return (
                      <div
                        key={clean.id}
                        className="rounded-xl border border-[#124559]/40 bg-[#124559]/30 px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#EFF6E0]">
                              {property?.name ?? "Property"}
                            </p>
                            <p className="text-xs text-[#EFF6E0]/60">
                              {time}
                            </p>
                            {clean.notes ? (
                              <p className="mt-2 text-xs text-[#EFF6E0]/70">
                                {strings.cleanNotes}: {clean.notes}
                              </p>
                            ) : null}
                            {property?.notes ? (
                              <p className="mt-2 text-xs text-[#EFF6E0]/70">
                                {strings.propertyNotes}: {property.notes}
                              </p>
                            ) : null}
                            {property?.checkout_time ? (
                              <p className="mt-2 text-xs text-[#EFF6E0]/70">
                                {strings.checkout}: {property.checkout_time}
                              </p>
                            ) : null}
                          </div>
                          {isCompany ? null : (
                            <button
                              type="button"
                              onClick={() => handleComplete(clean.id)}
                              disabled={completed || isPending}
                              className={clsx(
                                "rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
                                completed
                                  ? "border border-[#598392]/40 text-[#EFF6E0]/70"
                                  : "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-md hover:shadow-lg",
                                isPending ? "opacity-70" : ""
                              )}
                            >
                              {completed
                                ? strings.completed
                                : isPending
                                ? strings.completing
                                : strings.markComplete}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

    </div>
  );
}
