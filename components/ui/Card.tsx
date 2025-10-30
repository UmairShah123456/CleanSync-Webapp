"use client";

import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type CardProps = PropsWithChildren<{
  className?: string;
  title?: string;
  description?: string;
}>;

export function Card({ className, title, description, children }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4">
          {title ? (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
