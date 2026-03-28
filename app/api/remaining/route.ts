import { NextRequest, NextResponse } from "next/server";
import { getSessionRemaining } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || sessionId.length < 8) {
    return NextResponse.json({ remaining: 5 });
  }
  try {
    const remaining = await getSessionRemaining(sessionId);
    return NextResponse.json({ remaining });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load limit" }, { status: 500 });
  }
}
