import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/db";
import {
  CleanerAccessError,
  ensureIndividualCleanerAccess,
  fetchCleanWithRelations,
  mapCleanRecordToScheduleClean,
} from "../../../../utils";

type ReimbursementPayload = {
  amount?: number;
  item?: string;
};

type ReimbursementModificationPayload = {
  reimbursement_id?: string;
  amount?: number;
  item?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string; cleanId: string }> }
) {
  const { token, cleanId } = await context.params;
  let body: ReimbursementPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const amount = Number(body.amount);
  const item =
    typeof body.item === "string" ? body.item.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Provide a valid reimbursement amount above zero." },
      { status: 400 }
    );
  }

  if (!item) {
    return NextResponse.json(
      { error: "Provide a description for the reimbursement item." },
      { status: 400 }
    );
  }

  if (item.length > 200) {
    return NextResponse.json(
      { error: "Reimbursement item description is too long." },
      { status: 400 }
    );
  }

  const normalizedAmount = Math.round(amount * 100) / 100;
  const supabase = getServiceSupabaseClient();

  try {
    const { property } = await ensureIndividualCleanerAccess(
      supabase,
      token,
      cleanId
    );

    const { error: insertError } = await supabase
      .from("clean_reimbursements")
      .insert({
        clean_id: cleanId,
        amount: normalizedAmount,
        item,
      });

    if (insertError) {
      throw new CleanerAccessError(insertError.message, 500);
    }

    await supabase
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cleanId);

    const cleanRecord = await fetchCleanWithRelations(supabase, cleanId);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    if (error instanceof CleanerAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to log reimbursement." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ token: string; cleanId: string }> }
) {
  const { token, cleanId } = await context.params;
  let body: ReimbursementModificationPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const reimbursementId = body.reimbursement_id;
  if (!reimbursementId) {
    return NextResponse.json(
      { error: "Missing reimbursement identifier." },
      { status: 400 }
    );
  }

  if (typeof body.amount === "undefined" && typeof body.item === "undefined") {
    return NextResponse.json(
      { error: "Provide an amount or item to update." },
      { status: 400 }
    );
  }

  const updates: { amount?: number; item?: string } = {};

  if (typeof body.amount !== "undefined") {
    const amountValue = Number(body.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { error: "Amount must be a number greater than zero." },
        { status: 400 }
      );
    }
    updates.amount = Math.round(amountValue * 100) / 100;
  }

  if (typeof body.item !== "undefined") {
    if (typeof body.item !== "string" || !body.item.trim()) {
      return NextResponse.json(
        { error: "Provide a description for the reimbursement item." },
        { status: 400 }
      );
    }
    if (body.item.trim().length > 200) {
      return NextResponse.json(
        { error: "Reimbursement item description is too long." },
        { status: 400 }
      );
    }
    updates.item = body.item.trim();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { property } = await ensureIndividualCleanerAccess(
      supabase,
      token,
      cleanId
    );

    const { error: updateError } = await supabase
      .from("clean_reimbursements")
      .update(updates)
      .eq("id", reimbursementId)
      .eq("clean_id", cleanId);

    if (updateError) {
      throw new CleanerAccessError(updateError.message, 500);
    }

    await supabase
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cleanId);

    const cleanRecord = await fetchCleanWithRelations(supabase, cleanId);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    if (error instanceof CleanerAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to update reimbursement." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ token: string; cleanId: string }> }
) {
  const { token, cleanId } = await context.params;
  let body: ReimbursementModificationPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const reimbursementId = body.reimbursement_id;
  if (!reimbursementId) {
    return NextResponse.json(
      { error: "Missing reimbursement identifier." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { property } = await ensureIndividualCleanerAccess(
      supabase,
      token,
      cleanId
    );

    const { error: deleteError } = await supabase
      .from("clean_reimbursements")
      .delete()
      .eq("id", reimbursementId)
      .eq("clean_id", cleanId);

    if (deleteError) {
      throw new CleanerAccessError(deleteError.message, 500);
    }

    await supabase
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cleanId);

    const cleanRecord = await fetchCleanWithRelations(supabase, cleanId);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    if (error instanceof CleanerAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to delete reimbursement." },
      { status: 500 }
    );
  }
}
