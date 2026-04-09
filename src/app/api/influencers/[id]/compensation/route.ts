import { NextRequest, NextResponse } from "next/server";
import { Compensation } from "@/lib/types";

// In mock mode: acknowledges the update but doesn't persist.
// When Supabase is connected, replace with:
//   supabase.from("influencers").update({ compensation }).eq("id", id)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as Compensation;

  // Validate type field
  const validTypes = ["fixed", "commission", "hybrid", "per_post", "barter"];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid compensation type" }, { status: 400 });
  }

  // TODO Sprint 2: persist to Supabase
  // const { error } = await supabase.from("influencers")
  //   .update({ compensation: body })
  //   .eq("id", id);
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, influencer_id: id, compensation: body });
}
