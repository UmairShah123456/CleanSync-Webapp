import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import {
  CLEAN_STATUS_VALUES,
  CleanerAccessError,
  ensureIndividualCleanerAccess,
  fetchCleanWithRelations,
  mapCleanRecordToScheduleClean,
} from "../../../utils";

type UpdatePayload = {
  status?: "scheduled" | "completed" | "cancelled";
  maintenance_notes?: string[];
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ token: string; cleanId: string }> }
) {
  const { token, cleanId } = await context.params;
  let body: UpdatePayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { status, maintenance_notes } = body;

  if (typeof status === "undefined" && typeof maintenance_notes === "undefined") {
    return NextResponse.json(
      { error: "Provide a status or maintenance notes to update." },
      { status: 400 }
    );
  }

  let nextStatus: UpdatePayload["status"];
  if (typeof status !== "undefined") {
    const normalized = status.toLowerCase();
    if (!CLEAN_STATUS_VALUES.includes(normalized as any)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${CLEAN_STATUS_VALUES.join(
            ", "
          )}.`,
        },
        { status: 400 }
      );
    }
    nextStatus = normalized as UpdatePayload["status"];
  }

  let nextNotes: string[] | undefined;
  if (typeof maintenance_notes !== "undefined") {
    if (
      !Array.isArray(maintenance_notes) ||
      maintenance_notes.some((note) => typeof note !== "string")
    ) {
      return NextResponse.json(
        { error: "Maintenance notes must be an array of strings." },
        { status: 400 }
      );
    }

    nextNotes = Array.from(
      new Set(
        maintenance_notes
          .map((note) => note.trim())
          .filter((note) => note.length > 0)
      )
    );
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { property } = await ensureIndividualCleanerAccess(
      supabase,
      token,
      cleanId
    );

    const updatePayload: UpdatePayload & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof nextStatus !== "undefined") {
      updatePayload.status = nextStatus;
    }

    if (typeof nextNotes !== "undefined") {
      updatePayload.maintenance_notes = nextNotes;
    }

    const { error: updateError } = await supabase
      .from("cleans")
      .update(updatePayload)
      .eq("id", cleanId);

    if (updateError) {
      throw new CleanerAccessError(updateError.message, 500);
    }

    const cleanRecord = await fetchCleanWithRelations(supabase, cleanId);

    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    if (error instanceof CleanerAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to update clean." },
      { status: 500 }
    );
  }
}
