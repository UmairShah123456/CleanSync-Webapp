"use client";

import { useEffect, useState } from "react";

export function MetricCard({
  value,
  label,
  subtext,
  delay = 0,
}: {
  value: number;
  label: string;
  subtext: string;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      let current = 0;
      const increment = value / 30;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, 20);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className="rounded-xl bg-[#124559] p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-[#124559]/50 animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-4xl font-bold text-[#EFF6E0]">{displayValue}</p>
      <p className="mt-2 text-sm font-medium text-[#EFF6E0]">{label}</p>
      <p className="mt-1 text-xs text-[#EFF6E0]/70">{subtext}</p>
    </div>
  );
}
