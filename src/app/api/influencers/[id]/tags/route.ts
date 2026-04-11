import { NextRequest, NextResponse } from "next/server";
import { updateInfluencerTags } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { tags?: unknown };

  if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === "string")) {
    return NextResponse.json({ error: "tags muss string[] sein" }, { status: 400 });
  }

  // Trim, dedupe, drop empty
  const cleaned = Array.from(
    new Set(
      (body.tags as string[])
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.length <= 40)
    )
  );

  try {
    await updateInfluencerTags(id, cleaned);
    return NextResponse.json({ success: true, influencer_id: id, tags: cleaned });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
