import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, createAdminSessionToken } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  let password: unknown;
  try {
    const j = await req.json();
    password = j?.password;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const token = createAdminSessionToken();
    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
}
