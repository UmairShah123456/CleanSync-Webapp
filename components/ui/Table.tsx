"use client";

import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Table({ className, children }: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          className={clsx("min-w-full divide-y divide-slate-200", className)}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({
  className,
  children,
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return (
    <thead className={clsx("bg-slate-50", className)}>
      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        {children}
      </tr>
    </thead>
  );
}

export function TBody({
  className,
  children,
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return (
    <tbody className={clsx("divide-y divide-slate-200 bg-white", className)}>
      {children}
    </tbody>
  );
}

export function TRow({
  className,
  children,
}: PropsWithChildren<HTMLAttributes<HTMLTableRowElement>>) {
  return <tr className={clsx("text-sm text-slate-700", className)}>{children}</tr>;
}

export function TH({
  className,
  children,
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return (
    <th className={clsx("px-4 py-3 font-semibold", className)}>{children}</th>
  );
}

export function TD({
  className,
  children,
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return <td className={clsx("px-4 py-3", className)}>{children}</td>;
}
