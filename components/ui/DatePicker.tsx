"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import "react-day-picker/style.css";
import "@/styles/datepicker.css";

type DatePickerProps = {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        popupRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          "w-full flex items-center justify-between rounded-full bg-[#124559]/40 px-4 py-2 text-sm text-[#EFF6E0] focus:outline-none focus:ring-2 focus:ring-[#598392] border border-[#124559]/50 transition-all",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:bg-[#124559]/50 cursor-pointer"
        )}
      >
        <span className={clsx(value ? "text-[#EFF6E0]" : "text-[#EFF6E0]/50")}>
          {value ? format(value, "PPP") : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && !disabled && (
            <XMarkIcon
              className="h-4 w-4 text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
              onClick={handleClear}
            />
          )}
          <CalendarIcon className="h-4 w-4 text-[#EFF6E0]/70" />
        </div>
      </button>

      {isOpen &&
        portalEl &&
        createPortal(
          <div
            ref={popupRef}
            className="fixed z-[9999] rounded-xl bg-[#124559] border border-[#124559]/50 shadow-2xl p-4"
            style={{
              top: containerRef.current
                ? `${
                    containerRef.current.getBoundingClientRect().bottom +
                    window.scrollY +
                    8
                  }px`
                : "auto",
              left: containerRef.current
                ? `${
                    containerRef.current.getBoundingClientRect().left +
                    window.scrollX
                  }px`
                : "auto",
            }}
          >
            <DayPicker
              mode="single"
              selected={value || undefined}
              onSelect={(date) => {
                onChange(date || null);
                setIsOpen(false);
              }}
              className="dark-date-picker"
              modifiersClassNames={{
                selected: "selected-day",
                today: "today-day",
              }}
            />
          </div>,
          portalEl
        )}
    </div>
  );
}
