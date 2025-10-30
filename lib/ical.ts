import ical, { VEvent } from "node-ical";

export type CalendarEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary?: string;
  status?: string;
};

export const fetchCalendarEvents = async (
  url: string
): Promise<CalendarEvent[]> => {
  const result = await ical.async.fromURL(url);

  return Object.values(result)
    .filter((entry): entry is VEvent => entry.type === "VEVENT")
    .filter((event) => event.start && event.end && event.uid)
    .map((event) => ({
      uid: event.uid!,
      start: new Date(event.start!),
      end: new Date(event.end!),
      summary: event.summary ?? undefined,
      status: event.status ?? undefined,
    }));
};
