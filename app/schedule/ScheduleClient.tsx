"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/Spinner";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { CleanActionsModal } from "@/components/clean/CleanActionsModal";
import type { ScheduleClean, ScheduleProperty, ScheduleRange } from "./types";
import type { Translations } from "@/lib/translations/cleanerPortal";

type ScheduleView = "timeline" | "calendar";

// Purple/blue color palette for scheduled cleans (distinct from green completed cleans)
// Using varied shades with different saturation and lightness for better distinction
const PROPERTY_COLORS = [
  "#C084FC", // purple-400 - light purple
  "#7C3AED", // violet-600 - deep violet
  "#818CF8", // indigo-400 - light indigo-blue
  "#9333EA", // purple-600 - deep purple
  "#A78BFA", // violet-400 - light violet
  "#6366F1", // indigo-500 - medium indigo-blue
  "#A855F7", // purple-500 - medium purple
  "#8B5CF6", // violet-500 - medium violet
  "#C084FC", // purple-400 - light purple (repeat)
  "#7C3AED", // violet-600 - deep violet (repeat)
];

const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

type FetchUrlBuilder = (range: ScheduleRange, propertyId?: string) => string;

const createTimelineRange = (startDate: Date): ScheduleRange => {
  const from = new Date(startDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
};

const createCalendarRange = (monthDate: Date): ScheduleRange => {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  start.setHours(0, 0, 0, 0);
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};

const isSameLocalDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const EmptyState = ({ t }: { t?: Translations }) => {
  const text =
    t?.emptyStateText ||
    "Add a property first to start exploring your schedule. Once synced, every clean will appear on this timeline and calendar.";

  const handleGetStarted = () => {
    window.open("https://app.storylane.io/share/07jkbpodtmxn", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559]/40 p-12 text-center">
      <p className="text-sm text-[#EFF6E0]/70 mb-6">{text}</p>
      <button
        type="button"
        onClick={handleGetStarted}
        className="rounded-lg bg-gradient-to-r from-[#124559] to-[#598392] px-6 py-3 text-sm font-semibold text-[#EFF6E0] shadow-lg transition-all duration-150 hover:shadow-xl hover:scale-105 active:scale-95"
      >
        Get Started
      </button>
      <p className="mt-4 text-xs text-[#EFF6E0]/60">
        Check your junk mail — our emails sometimes land there.
      </p>
    </div>
  );
};

export function ScheduleClient({
  properties,
  initialCleans,
  initialRange,
  fetchUrlBuilder,
  title = "Schedule",
  description = "Track checkouts across your properties with a responsive timeline or calendar view.",
  portalContext,
  translations,
}: {
  properties: ScheduleProperty[];
  initialCleans: ScheduleClean[];
  initialRange: ScheduleRange;
  fetchUrlBuilder?: FetchUrlBuilder;
  title?: string;
  description?: string;
  portalContext?: {
    type: "cleaner";
    cleanerType: "individual" | "company";
    token: string;
  };
  translations?: Translations;
}) {
  const [view, setView] = useState<ScheduleView>("timeline");
  const isCleanerPortal = portalContext?.type === "cleaner";
  const cleanerToken = isCleanerPortal ? portalContext?.token ?? null : null;
  const [timelineStart, setTimelineStart] = useState(() => {
    const initial = new Date(initialRange.from);
    return new Date(
      initial.getFullYear(),
      initial.getMonth(),
      initial.getDate()
    );
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const baseline = new Date();
    return new Date(baseline.getFullYear(), baseline.getMonth(), 1);
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [cleans, setCleans] = useState<ScheduleClean[]>(initialCleans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propertyColorMap = useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((property, index) => {
      map.set(
        property.id,
        PROPERTY_COLORS[index % PROPERTY_COLORS.length] ?? PROPERTY_COLORS[0]
      );
    });
    return map;
  }, [properties]);

  const propertyLookup = useMemo(() => {
    const map = new Map<string, ScheduleProperty>();
    properties.forEach((property) => map.set(property.id, property));
    return map;
  }, [properties]);

  const [modalSelection, setModalSelection] = useState<{
    property: ScheduleProperty;
    clean: ScheduleClean | null;
  } | null>(null);

  const openModal = useCallback(
    (property: ScheduleProperty, clean: ScheduleClean | null = null) => {
      setModalSelection({ property, clean });
    },
    []
  );

  const handlePropertySelect = useCallback(
    (property: ScheduleProperty) => {
      openModal(property, null);
    },
    [openModal]
  );

  const handleCleanSelect = useCallback(
    (clean: ScheduleClean) => {
      const property = propertyLookup.get(clean.property_id);
      if (property) {
        openModal(property, clean);
      }
    },
    [openModal, propertyLookup]
  );

  const closeModal = useCallback(() => {
    setModalSelection(null);
  }, []);

  const applyCleanUpdates = useCallback(
    (updatedClean: ScheduleClean | null | undefined) => {
      if (!updatedClean || !updatedClean.id) {
        return;
      }

      setCleans((previous) =>
        previous.map((clean) =>
          clean.id === updatedClean.id ? { ...clean, ...updatedClean } : clean
        )
      );

      setModalSelection((current) => {
        if (
          !current ||
          !current.clean ||
          current.clean.id !== updatedClean.id
        ) {
          return current;
        }

        return {
          ...current,
          clean: { ...current.clean, ...updatedClean },
        };
      });
    },
    []
  );

  const activeClean = modalSelection?.clean ?? null;
  const activeProperty = modalSelection?.property ?? null;
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleViewChange = (nextView: ScheduleView) => {
    if (nextView === view) return;
    if (nextView === "calendar") {
      setSelectedMonth(
        new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1)
      );
    }
    setView(nextView);
  };

  const handleToday = () => {
    if (view === "timeline") {
      const today = startOfDay(new Date());
      setTimelineStart(today);
    } else {
      const currentMonth = startOfMonth(new Date());
      setSelectedMonth(currentMonth);
    }
  };

  const handlePrevious = () => {
    if (view === "timeline") {
      setTimelineStart((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      });
    } else {
      setSelectedMonth((prev) => addMonths(prev, -1));
    }
  };

  const handleNext = () => {
    if (view === "timeline") {
      setTimelineStart((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else {
      setSelectedMonth((prev) => addMonths(prev, 1));
    }
  };

  const filteredProperties = useMemo(() => {
    if (!selectedPropertyId) return properties;
    return properties.filter((property) => property.id === selectedPropertyId);
  }, [properties, selectedPropertyId]);

  const filteredCleans = useMemo(() => {
    if (!selectedPropertyId) return cleans;
    return cleans.filter((clean) => clean.property_id === selectedPropertyId);
  }, [cleans, selectedPropertyId]);

  const timelineDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDays(timelineStart, index)
    );
  }, [timelineStart]);

  const dateRangeLabel = useMemo(() => {
    if (view === "timeline") {
      const startLabel = format(timelineDays[0], "MMM d, yyyy");
      const endLabel = format(
        timelineDays[timelineDays.length - 1],
        "MMM d, yyyy"
      );
      return `${startLabel} - ${endLabel}`;
    }
    return format(selectedMonth, "MMMM, yyyy");
  }, [view, timelineDays, selectedMonth]);

  const buildUrl = useCallback(
    (range: ScheduleRange, propertyId?: string) => {
      if (fetchUrlBuilder) {
        return fetchUrlBuilder(range, propertyId);
      }
      const params = new URLSearchParams();
      params.append("from", range.from);
      params.append("to", range.to);
      if (propertyId) {
        params.append("property_id", propertyId);
      }
      return `/api/cleans?${params.toString()}`;
    },
    [fetchUrlBuilder]
  );

  const loadCleansForRange = useCallback(
    async (range: ScheduleRange, propertyId?: string) => {
      if (!properties.length) return;
      setLoading(true);
      setError(null);
      try {
        const url = buildUrl(range, propertyId);
        const response = await fetch(url, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load schedule data");
        }

        const data = (await response.json()) as ScheduleClean[];
        setCleans(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load schedule data."
        );
      } finally {
        setLoading(false);
      }
    },
    [properties.length, buildUrl]
  );

  const refreshCurrentRange = useCallback(() => {
    if (!properties.length) return;

    const range =
      view === "timeline"
        ? createTimelineRange(timelineStart)
        : createCalendarRange(selectedMonth);

    loadCleansForRange(range, selectedPropertyId || undefined);
  }, [
    loadCleansForRange,
    properties.length,
    selectedMonth,
    selectedPropertyId,
    timelineStart,
    view,
  ]);

  useEffect(() => {
    refreshCurrentRange();
  }, [refreshCurrentRange]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshCurrentRange();
      refreshTimeoutRef.current = null;
    }, 250);
  }, [refreshCurrentRange]);

  useEffect(() => {
    if (!properties.length) return;

    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      console.warn("Supabase client unavailable for realtime updates.", error);
      return;
    }

    const propertyIds = properties
      .map((property) => property.id)
      .filter((id) => Boolean(id));

    if (!propertyIds.length) {
      return;
    }

    const filterValues = propertyIds.map((id) => `"${id}"`).join(",");
    const filter = `property_id=in.(${filterValues})`;
    const channelKey = propertyIds.slice(0, 5).join("-");

    const channel = supabase
      .channel(
        `cleans-schedule-${isCleanerPortal ? "cleaner" : "owner"}-${channelKey}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cleans",
          filter,
        },
        () => {
          scheduleRealtimeRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [properties, scheduleRealtimeRefresh, isCleanerPortal]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  if (!properties.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#EFF6E0]">{title}</h1>
          <p className="mt-1 text-base text-[#EFF6E0]/70">
            Visualise every turnover by adding your first property.
          </p>
        </div>
        <EmptyState t={translations} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-2xl font-semibold text-[#EFF6E0]">{title}</h1>
          {description ? (
            <p className="mt-1 text-base text-[#EFF6E0]/70">{description}</p>
          ) : null}
        </div>

        <div className="rounded-xl border-[#124559]/50 bg-[#124559]/20 p-3 shadow-lg shadow-[#01161E]/40 sm:rounded-2xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Left side: Date navigation */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleToday}
                className="rounded-full border border-[#124559]/50 bg-[#124559]/40 px-3 py-2 text-xs font-medium text-[#EFF6E0] transition-colors active:bg-[#124559]/60 sm:px-4 sm:text-sm sm:hover:bg-[#124559]/60"
              >
                {translations?.today || "Today"}
              </button>
              <div className="rounded-full bg-[#124559]/35 px-3 py-2 text-xs font-semibold text-[#EFF6E0] sm:px-4 sm:text-sm">
                <span className="hidden sm:inline">{dateRangeLabel}</span>
                <span className="sm:hidden">
                  {view === "timeline"
                    ? format(timelineStart, "d MMM")
                    : format(selectedMonth, "MMM yyyy")}
                </span>
              </div>
              <div className="flex overflow-hidden rounded-full border border-[#124559]/50 bg-[#124559]/40">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="p-2 text-[#EFF6E0]/80 transition-colors active:bg-[#124559]/60 active:text-[#EFF6E0] sm:p-2.5 sm:hover:bg-[#124559]/60 sm:hover:text-[#EFF6E0]"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="border-l border-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors active:bg-[#124559]/60 active:text-[#EFF6E0] sm:p-2.5 sm:hover:bg-[#124559]/60 sm:hover:text-[#EFF6E0]"
                  aria-label="Next"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Right side: Property dropdown and view toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedPropertyId}
                  onChange={(event) =>
                    setSelectedPropertyId(event.target.value)
                  }
                  className="w-full appearance-none rounded-full border border-[#124559]/50 bg-[#01161E]/40 px-4 py-2.5 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] sm:w-48"
                >
                  <option value="">All properties</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#EFF6E0]/60">
                  ▼
                </span>
              </div>

              <div className="flex items-center rounded-full bg-[#01161E]/40 p-1">
                {(["timeline", "calendar"] as ScheduleView[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleViewChange(mode)}
                    className={clsx(
                      "rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm",
                      mode === view
                        ? "bg-gradient-to-r from-[#124559] to-[#598392] text-[#EFF6E0] shadow-lg"
                        : "text-[#EFF6E0]/70 active:text-[#EFF6E0] sm:hover:text-[#EFF6E0]"
                    )}
                  >
                    {mode === "timeline"
                      ? translations?.timeline || "Timeline"
                      : translations?.calendar || "Calendar"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="relative mt-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#01161E]/70">
                <Spinner
                  size="lg"
                  className="border-[#EFF6E0] border-t-transparent"
                />
              </div>
            ) : null}

            {view === "timeline" ? (
              <TimelineView
                properties={filteredProperties}
                cleans={filteredCleans}
                days={timelineDays}
                propertyColors={propertyColorMap}
                onPropertyClick={handlePropertySelect}
                onCleanClick={handleCleanSelect}
                translations={translations}
              />
            ) : (
              <CalendarView
                month={selectedMonth}
                cleans={filteredCleans}
                propertyColors={propertyColorMap}
                propertyLookup={propertyLookup}
                onEventClick={handleCleanSelect}
                translations={translations}
              />
            )}
          </div>
        </div>
      </div>

      <CleanActionsModal
        open={Boolean(modalSelection)}
        onClose={closeModal}
        property={activeProperty}
        clean={activeClean}
        context={
          isCleanerPortal
            ? {
                mode: "cleaner",
                cleanerType: portalContext?.cleanerType ?? "company",
                token: cleanerToken,
              }
            : { mode: "owner" }
        }
        onCleanUpdated={applyCleanUpdates}
        translations={translations}
      />
    </>
  );
}

function TimelineView({
  properties,
  cleans,
  days,
  propertyColors,
  onPropertyClick,
  onCleanClick,
  translations,
}: {
  properties: ScheduleProperty[];
  cleans: ScheduleClean[];
  days: Date[];
  propertyColors: Map<string, string>;
  onPropertyClick: (property: ScheduleProperty) => void;
  onCleanClick: (clean: ScheduleClean) => void;
  translations?: Translations;
}) {
  const today = new Date();

  const cleansByProperty = useMemo(() => {
    const map = new Map<string, ScheduleClean[]>();
    cleans.forEach((clean) => {
      if (!map.has(clean.property_id)) {
        map.set(clean.property_id, []);
      }
      map.get(clean.property_id)!.push(clean);
    });
    return map;
  }, [cleans]);

  const columnTemplate = useMemo(() => {
    // Mobile: smaller property column, fixed day columns
    // Desktop: larger property column, flexible day columns
    return `minmax(160px, 180px) repeat(${days.length}, minmax(100px, 1fr))`;
  }, [days.length]);

  if (!properties.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559]/10 p-12 text-center text-sm text-[#EFF6E0]/70">
        No properties match your current filter.
      </div>
    );
  }

  const hasCleans = cleans.length > 0;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full sm:block">
      <div
          className="min-w-[640px] rounded-xl border border-[#124559]/40 bg-[#01161E]/40"
        style={{ boxShadow: "0 15px 35px rgba(1, 22, 30, 0.35)" }}
      >
        <div
            className="grid border-b border-[#124559]/40 bg-[#124559]/30 text-[0.65rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70 sm:text-xs"
          style={{ gridTemplateColumns: columnTemplate }}
        >
            <div className="px-2 py-2 text-left text-[#EFF6E0] sm:px-4 sm:py-3">
              <span className="hidden sm:inline">
            {properties.length}{" "}
            {properties.length === 1 ? "Property" : "Properties"}
              </span>
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={clsx(
                  "px-2 py-2 text-center text-[#EFF6E0]/80 sm:px-4 sm:py-3",
                isSameLocalDay(day, today)
                  ? "bg-[#EFF6E0]/10 text-[#EFF6E0]"
                  : ""
              )}
            >
                <div className="text-[0.6rem] tracking-wider sm:text-[0.65rem]">
                {format(day, "EEE").toUpperCase()}
              </div>
                <div className="text-xs font-semibold sm:text-sm">
                {format(day, "d MMM")}
              </div>
            </div>
          ))}
        </div>

        {properties.map((property) => {
          const propertyCleans = cleansByProperty.get(property.id) ?? [];
          const color = propertyColors.get(property.id) ?? PROPERTY_COLORS[0];
          const indicator = hexToRgba(color, 0.9);
          const pillBackground = hexToRgba(color, 0.4);
          const pillBorder = hexToRgba(color, 0.7);

          return (
            <div
              key={property.id}
              className="grid border-b border-[#124559]/35 last:border-b-0"
              style={{ gridTemplateColumns: columnTemplate }}
            >
              <div
                  className="flex flex-col gap-1 border-r border-[#124559]/35 px-2 py-3 transition-colors active:bg-[#124559]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392] cursor-pointer sm:px-4 sm:py-4 sm:hover:bg-[#124559]/25"
                role="button"
                tabIndex={0}
                onClick={() => onPropertyClick(property)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPropertyClick(property);
                  }
                }}
                aria-label={`View utility information for ${property.name}`}
              >
                  <div className="flex items-start gap-2 sm:gap-3">
                  <span
                      className="mt-0.5 inline-block h-6 w-1 rounded-full shrink-0 sm:mt-1 sm:h-8 sm:w-1.5"
                    style={{ backgroundColor: indicator }}
                  />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#EFF6E0] leading-tight sm:text-sm">
                      {property.name}
                    </p>
                      <p className="mt-0.5 text-[0.65rem] text-[#EFF6E0]/60 sm:text-xs">
                        {property.checkout_time ?? "10:00"}
                    </p>
                    {property.cleaner ? (
                        <p className="mt-0.5 text-[0.6rem] text-[#EFF6E0]/50 sm:text-xs">
                          {property.cleaner}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {days.map((day) => {
                const cleansForDay = propertyCleans.filter((clean) => {
                  const scheduled = new Date(clean.scheduled_for);
                  return isSameLocalDay(scheduled, day);
                });

                return (
                  <div
                    key={`${property.id}-${day.toISOString()}`}
                    className={clsx(
                        "min-h-[80px] border-r border-[#124559]/25 p-2 sm:min-h-[96px] sm:p-3",
                      isSameLocalDay(day, today) ? "bg-[#EFF6E0]/6" : ""
                    )}
                  >
                      <div className="space-y-1.5 sm:space-y-2">
                        {cleansForDay.map((clean) => {
                          const isCompleted = clean.status === "completed";
                          const isCancelled = clean.status === "cancelled";
                          const isMissed = clean.status === "missed";
                          const completedBg = "rgba(16, 185, 129, 0.6)"; // emerald-500 with opacity
                          const completedBorder = "rgba(16, 185, 129, 0.9)"; // emerald-500 with higher opacity
                          const cancelledBg = "rgba(239, 68, 68, 0.6)"; // red-500 with opacity
                          const cancelledBorder = "rgba(239, 68, 68, 0.9)"; // red-500 with higher opacity
                          const missedBg = "rgba(251, 146, 60, 0.6)"; // amber-500 with opacity
                          const missedBorder = "rgba(251, 146, 60, 0.9)"; // amber-500 with higher opacity

                          return (
                        <div
                          key={clean.id}
                              className={clsx(
                                "rounded-lg border px-2 py-1.5 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598392] sm:px-3 sm:py-2",
                                isCompleted
                                  ? "border-emerald-400/80 bg-emerald-500/50 active:border-emerald-300 active:bg-emerald-500/60 sm:hover:border-emerald-300 sm:hover:bg-emerald-500/60"
                                  : isCancelled
                                  ? "border-red-400/80 bg-red-500/50 active:border-red-300 active:bg-red-500/60 sm:hover:border-red-300 sm:hover:bg-red-500/60"
                                  : isMissed
                                  ? "border-amber-400/80 bg-amber-500/50 active:border-amber-300 active:bg-amber-500/60 sm:hover:border-amber-300 sm:hover:bg-amber-500/60"
                                  : "active:border-[#EFF6E0]/60 active:bg-white/10 sm:hover:border-[#EFF6E0]/60 sm:hover:bg-white/10"
                              )}
                              style={
                                isCompleted
                                  ? {
                                      backgroundColor: completedBg,
                                      borderColor: completedBorder,
                                    }
                                  : isCancelled
                                  ? {
                                      backgroundColor: cancelledBg,
                                      borderColor: cancelledBorder,
                                    }
                                  : isMissed
                                  ? {
                                      backgroundColor: missedBg,
                                      borderColor: missedBorder,
                                    }
                                  : {
                            backgroundColor: pillBackground,
                            borderColor: pillBorder,
                                    }
                              }
                          role="button"
                          tabIndex={0}
                          onClick={() => onCleanClick(clean)}
                          onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                              event.preventDefault();
                              onCleanClick(clean);
                            }
                          }}
                          aria-label={`Inspect clean scheduled for ${formatTime(
                            clean.scheduled_for
                          )} at ${property.name}`}
                        >
                              <div className="flex items-center justify-between gap-1 text-[0.65rem] font-semibold text-white sm:text-[0.7rem]">
                                <span className="font-bold drop-shadow-sm truncate">
                              {formatTime(clean.scheduled_for)}
                            </span>
                                <span className="uppercase tracking-wide text-[0.55rem] font-semibold text-white/95 shrink-0 sm:text-[0.6rem]">
                              {clean.status}
                            </span>
                          </div>
                          {clean.notes ? (
                                <p className="mt-0.5 line-clamp-1 text-[0.6rem] font-medium text-white/90 sm:mt-1 sm:text-[0.65rem]">
                              {clean.notes}
                            </p>
                          ) : null}
                        </div>
                          );
                        })}
                      {cleansForDay.length === 0 ? (
                          <div className="text-center text-[0.6rem] text-[#EFF6E0]/40 sm:text-[0.65rem]">
                          —
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {!hasCleans ? (
            <div className="px-4 py-6 text-center text-xs text-[#EFF6E0]/60 sm:px-6 sm:py-8 sm:text-sm">
            No cleans scheduled for this range.
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  month,
  cleans,
  propertyColors,
  propertyLookup,
  onEventClick,
  translations,
}: {
  month: Date;
  cleans: ScheduleClean[];
  propertyColors: Map<string, string>;
  propertyLookup: Map<string, ScheduleProperty>;
  onEventClick: (clean: ScheduleClean) => void;
  translations?: Translations;
}) {
  const weekdayLabels = translations?.weekdays || WEEKDAY_LABELS_EN;
  const today = new Date();

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start, end });

  const cleansByDay = useMemo(() => {
    const map = new Map<string, ScheduleClean[]>();
    cleans.forEach((clean) => {
      const date = new Date(clean.scheduled_for);
      const key = formatDateKey(date);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(clean);
    });
    return map;
  }, [cleans]);

  return (
    <div className="rounded-xl border border-[#124559]/40 bg-[#01161E]/40 shadow-lg shadow-[#01161E]/40">
      <div className="grid grid-cols-7 border-b border-[#124559]/40 bg-[#124559]/30 text-[0.65rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70 sm:text-xs">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-1 py-2 text-center sm:px-3 sm:py-3">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const key = formatDateKey(day);
          const entries = cleansByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, month);
          const isTodayFlag = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={clsx(
                "min-h-[80px] border-b border-r border-[#124559]/25 p-1.5 sm:min-h-[120px] sm:p-3",
                isTodayFlag ? "bg-[#EFF6E0]/8" : "",
                !isCurrentMonth ? "bg-[#01161E]/20 text-[#EFF6E0]/40" : ""
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={clsx(
                    "text-[0.7rem] font-semibold sm:text-sm",
                    isCurrentMonth ? "text-[#EFF6E0]" : "text-[#EFF6E0]/40"
                  )}
                >
                  <span className="hidden sm:inline">
                  {format(day, "MMM d")}
                  </span>
                  <span className="sm:hidden">{format(day, "d")}</span>
                </span>
                {entries.length ? (
                  <span className="rounded-full bg-[#124559]/40 px-1.5 py-0.5 text-[0.55rem] font-semibold text-[#EFF6E0]/80 sm:px-2 sm:text-[0.6rem]">
                    {entries.length}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 space-y-1 sm:mt-2 sm:space-y-2">
                {entries.map((clean) => {
                  const isCompleted = clean.status === "completed";
                  const isCancelled = clean.status === "cancelled";
                  const isMissed = clean.status === "missed";
                  const color =
                    propertyColors.get(clean.property_id) ?? PROPERTY_COLORS[0];
                  const property = propertyLookup.get(clean.property_id);

                  return (
                    <div
                      key={clean.id}
                      className={clsx(
                        "rounded-full border px-2 py-1 text-[0.6rem] font-medium text-white transition-colors sm:px-3 sm:py-1 sm:text-[0.65rem]",
                        isCompleted
                          ? "border-emerald-400/80 bg-emerald-500/60 active:opacity-90 sm:hover:opacity-90"
                          : isCancelled
                          ? "border-red-400/80 bg-red-500/60 active:opacity-90 sm:hover:opacity-90"
                          : isMissed
                          ? "border-amber-400/80 bg-amber-500/60 active:opacity-90 sm:hover:opacity-90"
                          : "active:opacity-80",
                        property ? "cursor-pointer active:scale-95" : ""
                      )}
                      style={
                        isCompleted
                          ? {
                              backgroundColor: "rgba(16, 185, 129, 0.6)",
                              borderColor: "rgba(16, 185, 129, 0.9)",
                            }
                          : isCancelled
                          ? {
                              backgroundColor: "rgba(239, 68, 68, 0.6)",
                              borderColor: "rgba(239, 68, 68, 0.9)",
                            }
                          : isMissed
                          ? {
                              backgroundColor: "rgba(251, 146, 60, 0.6)",
                              borderColor: "rgba(251, 146, 60, 0.9)",
                            }
                          : {
                        backgroundColor: hexToRgba(color, 0.55),
                        borderColor: hexToRgba(color, 0.85),
                            }
                      }
                      role={property ? "button" : undefined}
                      tabIndex={property ? 0 : -1}
                      onClick={() => {
                        if (property) {
                          onEventClick(clean);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (!property) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onEventClick(clean);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <span className="truncate font-semibold">
                          <span className="hidden sm:inline">
                          {clean.property_name}
                        </span>
                          <span className="sm:hidden">
                            {clean.property_name.split(" ")[0]}
                          </span>
                        </span>
                        <span className="hidden shrink-0 text-[0.55rem] font-semibold sm:inline sm:text-[0.6rem]">
                          {formatTime(clean.scheduled_for)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {!entries.length ? (
                  <p className="text-center text-[0.6rem] text-[#EFF6E0]/30 sm:text-[0.65rem]">
                    —
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
