import { NextRequest, NextResponse } from "next/server";
import { Compensation } from "@/lib/types";
import { updateCompensation } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as Compensation;

  const validTypes = ["fixed", "commission", "hybrid", "per_post", "barter"];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid compensation type" }, { status: 400 });
  }

  try {
    await updateCompensation(id, body);
    return NextResponse.json({ success: true, influencer_id: id, compensation: body });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
