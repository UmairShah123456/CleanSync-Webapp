import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/db";
import {
  fetchCleanWithRelations,
  mapCleanRecordToScheduleClean,
} from "@/app/api/cleaner-links/utils";

type ReimbursementPayload = {
  amount?: number;
  item?: string;
};

type ModificationPayload = {
  reimbursement_id?: string;
  amount?: number;
  item?: string;
};

async function ensureOwnerAccess(cleanId: string, userId: string) {
  const serviceClient = getServiceSupabaseClient();

  const { data: cleanRecord, error: cleanError } = await serviceClient
    .from("cleans")
    .select("id, property_id")
    .eq("id", cleanId)
    .maybeSingle();

  if (cleanError) {
    throw new Error(cleanError.message);
  }

  if (!cleanRecord) {
    throw new Error("Clean not found");
  }

  const { data: propertyRecord, error: propertyError } = await serviceClient
    .from("properties")
    .select("id, name, cleaner, user_id, checkout_time, access_codes, bin_locations, property_address, key_locations")
    .eq("id", cleanRecord.property_id)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message);
  }

  if (!propertyRecord) {
    throw new Error("Property not found");
  }

  if (propertyRecord.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  return {
    serviceClient,
    property: propertyRecord,
  } as const;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReimbursementPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const amountValue = Number(body.amount);
  const item = typeof body.item === "string" ? body.item.trim() : "";

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
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

  try {
    const { serviceClient, property } = await ensureOwnerAccess(id, user.id);

    const normalizedAmount = Math.round(amountValue * 100) / 100;

    const { error: insertError } = await serviceClient
      .from("clean_reimbursements")
      .insert({
        clean_id: id,
        amount: normalizedAmount,
        item,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    await serviceClient
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    const cleanRecord = await fetchCleanWithRelations(serviceClient, id);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log reimbursement.";
    const status = message === "Unauthorized" ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ModificationPayload = {};

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

  try {
    const { serviceClient, property } = await ensureOwnerAccess(id, user.id);

    const { error: updateError } = await serviceClient
      .from("clean_reimbursements")
      .update(updates)
      .eq("id", reimbursementId)
      .eq("clean_id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await serviceClient
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    const cleanRecord = await fetchCleanWithRelations(serviceClient, id);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update reimbursement.";
    const status = message === "Unauthorized" ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ModificationPayload = {};

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

  try {
    const { serviceClient, property } = await ensureOwnerAccess(id, user.id);

    const { error: deleteError } = await serviceClient
      .from("clean_reimbursements")
      .delete()
      .eq("id", reimbursementId)
      .eq("clean_id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await serviceClient
      .from("cleans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    const cleanRecord = await fetchCleanWithRelations(serviceClient, id);
    const clean = mapCleanRecordToScheduleClean(cleanRecord, property);

    return NextResponse.json({ clean });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete reimbursement.";
    const status = message === "Unauthorized" ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
