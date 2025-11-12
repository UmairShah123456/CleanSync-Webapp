export type ScheduleProperty = {
  id: string;
  name: string;
  checkout_time?: string | null;
  cleaner?: string | null;
  access_codes?: string | null;
  bin_locations?: string | null;
 property_address?: string | null;
  key_locations?: string | null;
  cleaning_checklists?: Array<{
    id: string;
    room: string;
    task: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }> | null;
};

export type CleanReimbursement = {
  id: string;
  amount: number;
  item: string;
  created_at: string;
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
  maintenance_notes?: string[] | null;
  reimbursements?: CleanReimbursement[];
  checklist_completions?: Array<{
    id: string;
    checklist_item_id: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }> | null;
};

export type ScheduleRange = {
  from: string;
  to: string;
};
