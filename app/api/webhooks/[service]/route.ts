import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ service: string }> }
) {
  const { service } = await context.params;
  const payload = await request.json().catch(() => ({}));

  // Placeholder handler for future webhook integrations (Supabase, Vercel, etc.)
  // For now, simply acknowledge receipt so that upstream services do not retry.
  return NextResponse.json(
    {
      received: true,
      service,
      payload,
    },
    { status: 200 }
  );
}
