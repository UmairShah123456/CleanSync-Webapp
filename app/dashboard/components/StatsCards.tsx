"use client";

import { Card } from "@/components/ui/Card";

export type Stats = {
  upcoming: number;
  sameDay: number;
  cancelled: number;
};

export function StatsCards({ stats }: { stats: Stats }) {
  const items = [
    {
      label: "Upcoming cleans",
      value: stats.upcoming,
      description: "Scheduled within the next 30 days",
    },
    {
      label: "Same-day turnovers",
      value: stats.sameDay,
      description: "Cleaners need a quick reset today",
    },
    {
      label: "Cancelled cleans",
      value: stats.cancelled,
      description: "Removed due to guest cancellations",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
          <p className="mt-2 text-sm text-slate-500">{item.description}</p>
        </Card>
      ))}
    </div>
  );
}
