export type ScheduleProperty = {
  id: string;
  name: string;
  checkout_time?: string | null;
  cleaner?: string | null;
};

export type ScheduleClean = {
  id: string;
  booking_uid: string;
  property_id: string;
  property_name: string;
  scheduled_for: string;
  status: string;
  notes?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  cleaner?: string | null;
};

export type ScheduleRange = {
  from: string;
  to: string;
};
