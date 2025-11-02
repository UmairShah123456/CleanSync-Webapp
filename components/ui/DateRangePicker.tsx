"use client";

import * as React from "react";
import { DateRangePicker as HeroDateRangePicker } from "@heroui/react";
import type { RangeValue } from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";
import clsx from "clsx";

type DateRangePickerProps = {
  value?: { from?: Date; to?: Date } | null;
  onChange: (range: { from?: Date; to?: Date } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

// Convert Date to CalendarDate
const dateToCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
};

// Convert CalendarDate to Date
const calendarDateToDate = (calendarDate: CalendarDate): Date => {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
  disabled,
}: DateRangePickerProps) {
  // Convert value to RangeValue<CalendarDate>
  const rangeValue: RangeValue<CalendarDate> | null = React.useMemo(() => {
    if (!value || (!value.from && !value.to)) {
      return null;
    }
    // If both dates are provided
    if (value.from && value.to) {
      return {
        start: dateToCalendarDate(value.from),
        end: dateToCalendarDate(value.to),
      };
    }
    // If only start is provided
    if (value.from) {
      return {
        start: dateToCalendarDate(value.from),
        end: dateToCalendarDate(value.from),
      };
    }
    // If only end is provided
    if (value.to) {
      return {
        start: dateToCalendarDate(value.to),
        end: dateToCalendarDate(value.to),
      };
    }
    return null;
  }, [value]);

  const handleChange = (range: RangeValue<CalendarDate> | null) => {
    if (!range) {
      onChange(null);
      return;
    }

    const dateRange = {
      from: calendarDateToDate(range.start),
      to: calendarDateToDate(range.end),
    };

    onChange(dateRange);
  };

  return (
    <I18nProvider locale="en-GB">
      <div className={clsx("relative w-full", className)}>
        <HeroDateRangePicker
          label={placeholder}
          value={rangeValue}
          onChange={handleChange}
          isDisabled={disabled}
        />
      </div>
    </I18nProvider>
  );
}
