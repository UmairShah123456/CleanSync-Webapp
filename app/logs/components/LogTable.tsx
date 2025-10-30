import { formatDateTime } from "@/lib/utils";

export type LogRow = {
  id: string;
  property_name: string;
  run_at: string;
  bookings_added: number;
  bookings_removed: number;
  bookings_updated: number;
};

export function LogTable({ logs }: { logs: LogRow[] }) {
  if (!logs.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#598392]/30 bg-[#124559] p-12 text-center text-sm text-[#EFF6E0]/70">
        No sync activity yet. Trigger a sync to populate this list.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#124559] p-6 border border-[#124559]/50 animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#598392]/30">
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Run at
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Property
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Added
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Updated
              </th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#598392]">
                Cancelled
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#598392]/20">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="transition-colors duration-200 hover:bg-[#124559]/50"
              >
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {formatDateTime(log.run_at)}
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {log.property_name}
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {log.bookings_added}
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {log.bookings_updated}
                </td>
                <td className="py-4 text-sm text-[#EFF6E0]/70">
                  {log.bookings_removed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
