import {
  CalendarDaysIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";
import type { CleanerWithAssignments } from "../CleanersClient";

export function CleanerList({
  cleaners,
  onEdit,
}: {
  cleaners: CleanerWithAssignments[];
  onEdit: (cleaner: CleanerWithAssignments) => void;
}) {
  if (!cleaners.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
        Add your first cleaner to start tracking assignments and availability.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cleaners.map((cleaner) => (
        <div
          key={cleaner.id}
          className="group relative overflow-hidden rounded-2xl border border-[#124559]/50 bg-[#01161E]/60 p-6 shadow-lg shadow-[#01161E]/40 transition-all duration-300 hover:-translate-y-1 hover:border-[#598392]/60 hover:shadow-2xl hover:shadow-[#01161E]/60"
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(89,131,146,0.35), transparent 55%)",
            }}
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-[#EFF6E0]">
                  {cleaner.name}
                </h3>
                <span className="rounded-full bg-[#124559]/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#EFF6E0]/70">
                  {cleaner.cleaner_type === "company" ? "Company" : "Individual"}
                </span>
              </div>
              {cleaner.created_at ? (
                <p className="mt-1 text-xs text-[#EFF6E0]/50">
                  Added {formatDateTime(cleaner.created_at)}
                </p>
              ) : null}
            </div>
            <button
              onClick={() => onEdit(cleaner)}
              className="rounded-full border border-transparent bg-[#124559]/60 p-2 text-[#EFF6E0]/80 transition-colors hover:border-[#598392]/60 hover:bg-[#598392]/30 hover:text-[#EFF6E0]"
              type="button"
              aria-label={`Edit ${cleaner.name}`}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-6 space-y-3 text-sm">
            {cleaner.phone ? (
              <InfoRow
                icon={PhoneIcon}
                label="Phone"
                value={<span className="text-[#EFF6E0]">{cleaner.phone}</span>}
              />
            ) : null}

            <InfoRow
              icon={BuildingOffice2Icon}
              label="Assigned properties"
              value={
                cleaner.assigned_properties.length ? (
                  <div className="flex flex-wrap gap-2">
                    {cleaner.assigned_properties.map((property) => (
                      <span
                        key={property.id}
                        className="rounded-full border border-[#598392]/40 bg-[#124559]/40 px-3 py-1 text-xs font-semibold text-[#EFF6E0]/80"
                      >
                        {property.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#EFF6E0]/50">Not assigned yet</span>
                )
              }
            />

            {cleaner.notes ? (
              <InfoRow
                icon={CalendarDaysIcon}
                label="Notes"
                value={
                  <p className="text-sm text-[#EFF6E0]/80">{cleaner.notes}</p>
                }
              />
            ) : null}

            {cleaner.payment_details ? (
              <InfoRow
                icon={CalendarDaysIcon}
                label="Payment details"
                value={
                  <p className="text-sm text-[#EFF6E0]/80">
                    {cleaner.payment_details}
                  </p>
                }
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDaysIcon;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-[#124559]/40 bg-[#01161E]/40 px-4 py-3">
    <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#598392]" />
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#EFF6E0]/50">
        {label}
      </p>
      <div className="mt-1 text-sm text-[#EFF6E0]/80">{value}</div>
    </div>
  </div>
);
