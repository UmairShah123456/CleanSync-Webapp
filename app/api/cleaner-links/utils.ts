import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleClean } from "@/app/schedule/types";

export const CLEAN_STATUS_VALUES = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export class CleanerAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type CleanerRecord = {
  id: string;
  user_id: string;
  name: string;
  cleaner_type: "individual" | "company";
};

export type CleanRecord = {
  id: string;
  booking_uid: string | null;
  property_id: string;
  scheduled_for: string;
  status: string;
  notes: string | null;
  maintenance_notes: string[] | null;
  bookings?: {
    checkin?: string | null;
    checkout?: string | null;
  } | null;
  clean_reimbursements?: Array<{
    id: string;
    amount: number | string;
    item: string;
    created_at: string;
  }>;
  checklist_completions?: Array<{
    id: string;
    checklist_item_id: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

type PropertyRecord = {
  id: string;
  name: string;
  cleaner: string | null;
  user_id: string;
  checkout_time?: string | null;
  access_codes?: string | null;
  bin_locations?: string | null;
  property_address?: string | null;
  key_locations?: string | null;
};

export type CleanerAccessContext = {
  cleaner: CleanerRecord;
  clean: CleanRecord;
  property: PropertyRecord;
};

export async function ensureIndividualCleanerAccess(
  supabase: SupabaseClient,
  token: string,
  cleanId: string
): Promise<CleanerAccessContext> {
  const { data: linkData, error: linkError } = await supabase
    .from("cleaner_links")
    .select(
      `
        id,
        cleaner:cleaners (
          id,
          user_id,
          name,
          cleaner_type
        )
      `
    )
    .eq("token", token)
    .maybeSingle<{ id: string; cleaner: CleanerRecord | null }>();

  if (linkError) {
    throw new CleanerAccessError(linkError.message, 500);
  }

  if (!linkData || !linkData.cleaner) {
    throw new CleanerAccessError("Invalid link.", 404);
  }

  const { data: cleanData, error: cleanError } = await supabase
    .from("cleans")
    .select(
      `
        id,
        booking_uid,
        property_id,
        scheduled_for,
        status,
        notes,
        maintenance_notes
      `
    )
    .eq("id", cleanId)
    .maybeSingle<CleanRecord>();

  if (cleanError) {
    throw new CleanerAccessError(cleanError.message, 500);
  }

  if (!cleanData) {
    throw new CleanerAccessError("Clean not found.", 404);
  }

  // Fetch booking separately since we no longer have a foreign key relationship
  if (cleanData.booking_uid && cleanData.property_id) {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("checkin, checkout")
      .eq("uid", cleanData.booking_uid)
      .eq("property_id", cleanData.property_id)
      .maybeSingle();

    if (bookingData) {
      cleanData.bookings = {
        checkin: bookingData.checkin,
        checkout: bookingData.checkout,
      };
    }
  }

  const { data: propertyData, error: propertyError } = await supabase
    .from("properties")
    .select(
      "id, name, cleaner, user_id, checkout_time, access_codes, bin_locations, property_address, key_locations"
    )
    .eq("id", cleanData.property_id)
    .maybeSingle<PropertyRecord>();

  if (propertyError) {
    throw new CleanerAccessError(propertyError.message, 500);
  }

  if (!propertyData) {
    throw new CleanerAccessError("Property not found.", 404);
  }

  if (propertyData.user_id !== linkData.cleaner.user_id) {
    throw new CleanerAccessError(
      "This property is not managed by the link owner.",
      403
    );
  }

  const cleanerName = linkData.cleaner.name.trim().toLowerCase();
  const propertyCleaner = propertyData.cleaner?.trim().toLowerCase();

  if (!propertyCleaner || propertyCleaner !== cleanerName) {
    throw new CleanerAccessError(
      "This clean is not assigned to the cleaner.",
      403
    );
  }

  return {
    cleaner: linkData.cleaner,
    clean: cleanData,
    property: propertyData,
  };
}

export function mapCleanRecordToScheduleClean(
  clean: CleanRecord,
  property: PropertyRecord
): ScheduleClean {
  return {
    id: clean.id,
    booking_uid: clean.booking_uid ?? "",
    property_id: clean.property_id,
    property_name: property.name ?? "Unknown property",
    scheduled_for: clean.scheduled_for,
    status: clean.status,
    notes: clean.notes,
    checkin: clean.bookings?.checkin ?? null,
    checkout: clean.bookings?.checkout ?? null,
    cleaner: property.cleaner ?? null,
    maintenance_notes: clean.maintenance_notes ?? [],
    reimbursements: (clean.clean_reimbursements ?? []).map((entry) => ({
      id: entry.id,
      amount: Number(entry.amount),
      item: entry.item,
      created_at: entry.created_at,
    })),
    checklist_completions: clean.checklist_completions ?? [],
  };
}

export async function fetchCleanWithRelations(
  supabase: SupabaseClient,
  cleanId: string
): Promise<CleanRecord> {
  const { data, error } = await supabase
    .from("cleans")
    .select(
      `
        id,
        booking_uid,
        property_id,
        scheduled_for,
        status,
        notes,
        maintenance_notes,
        clean_reimbursements ( id, amount, item, created_at )
      `
    )
    .eq("id", cleanId)
    .maybeSingle<CleanRecord>();

  if (error) {
    throw new CleanerAccessError(error.message, 500);
  }

  if (!data) {
    throw new CleanerAccessError("Clean not found.", 404);
  }

  // Fetch booking separately since we no longer have a foreign key relationship
  if (data.booking_uid && data.property_id) {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("checkin, checkout")
      .eq("uid", data.booking_uid)
      .eq("property_id", data.property_id)
      .maybeSingle();

    if (bookingData) {
      data.bookings = {
        checkin: bookingData.checkin,
        checkout: bookingData.checkout,
      };
    }
  }

  // Fetch checklist completions separately since we no longer have a foreign key relationship
  const { data: completions } = await supabase
    .from("clean_checklist_completions")
    .select(
      "id, checklist_item_id, completed, completed_at, created_at, updated_at"
    )
    .eq("clean_id", cleanId);

  if (completions) {
    data.checklist_completions = completions.map((comp: any) => ({
      id: comp.id,
      checklist_item_id: comp.checklist_item_id,
      completed: comp.completed,
      completed_at: comp.completed_at,
      created_at: comp.created_at,
      updated_at: comp.updated_at,
    }));
  } else {
    data.checklist_completions = [];
  }

  return data;
}
