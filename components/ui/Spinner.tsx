"use client";

import clsx from "clsx";

export type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes: Record<string, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <span
      className={clsx(
        "inline-block animate-spin rounded-full border-blue-500 border-t-transparent",
        sizes[size],
        className
      )}
    />
  );
}
