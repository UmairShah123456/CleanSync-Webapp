"use client";

import { Badge } from "@/components/ui/Badge";
import { Table, THead, TH, TBody, TRow, TD } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/utils";

export type CleanRow = {
  id: string;
  property_name: string;
  scheduled_for: string;
  status: string;
  notes?: string | null;
  booking_uid: string;
};

const statusVariant: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  scheduled: "success",
  cancelled: "danger",
  completed: "neutral",
};

export function CleanTable({ cleans }: { cleans: CleanRow[] }) {
  if (!cleans.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        No cleans found for the selected filters.
      </div>
    );
  }

  return (
    <Table>
      <THead>
        <TH>Scheduled for</TH>
        <TH>Property</TH>
        <TH>Status</TH>
        <TH>Notes</TH>
      </THead>
      <TBody>
        {cleans.map((clean) => (
          <TRow key={clean.id}>
            <TD className="whitespace-nowrap font-medium text-slate-800">
              {formatDateTime(clean.scheduled_for)}
            </TD>
            <TD className="text-slate-600">{clean.property_name}</TD>
            <TD>
              <Badge variant={statusVariant[clean.status] ?? "neutral"}>
                {clean.status === "scheduled"
                  ? "✅ Scheduled"
                  : clean.status === "cancelled"
                  ? "❌ Cancelled"
                  : "Completed"}
              </Badge>
            </TD>
            <TD className="text-slate-600">
              {clean.notes ? clean.notes : "—"}
            </TD>
          </TRow>
        ))}
      </TBody>
    </Table>
  );
}
