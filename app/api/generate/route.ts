import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { hashIp } from "@/lib/hash";
import { callModalGenerate } from "@/lib/modal";
import { getDb } from "@/lib/firebase-admin";
import { checkAndConsumeSessionLimit, refundSessionLimit } from "@/lib/rate-limit";
import type { BuzzwordDensity, GenerateRequestBody, PostLength } from "@/lib/types";

const MAX_ACHIEVEMENT = 500;

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function validateBody(body: unknown): GenerateRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const achievement = b.achievement;
  const drama_level = b.drama_level;
  const buzzword_density = b.buzzword_density;
  const post_length = b.post_length;
  const session_id = b.session_id;
  if (typeof achievement !== "string" || achievement.trim().length === 0) return null;
  if (achievement.length > MAX_ACHIEVEMENT) return null;
  if (typeof drama_level !== "number" || drama_level < 1 || drama_level > 10 || !Number.isInteger(drama_level)) {
    return null;
  }
  const bd = ["low", "medium", "max"] as const;
  if (typeof buzzword_density !== "string" || !bd.includes(buzzword_density as BuzzwordDensity)) {
    return null;
  }
  const pl = ["short", "medium", "long"] as const;
  if (typeof post_length !== "string" || !pl.includes(post_length as PostLength)) {
    return null;
  }
  if (typeof session_id !== "string" || session_id.length < 8) return null;
  return {
    achievement: achievement.trim(),
    drama_level,
    buzzword_density: buzzword_density as BuzzwordDensity,
    post_length: post_length as PostLength,
    session_id,
  };
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = validateBody(json);
  if (!validated) {
    return NextResponse.json(
      { error: "Invalid input. Check achievement, drama (1–10), buzzwords, length, and session." },
      { status: 400 },
    );
  }

  const salt = process.env.IP_HASH_SALT;
  const hashed_ip = hashIp(getClientIp(req), salt);

  const limit = await checkAndConsumeSessionLimit(validated.session_id);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          "You've hit your 5 free posts today. Need more access? Write to me.",
        remaining: 0,
      },
      { status: 429 },
    );
  }

  let output;
  try {
    output = await callModalGenerate({
      achievement: validated.achievement,
      drama_level: validated.drama_level,
      buzzword_density: validated.buzzword_density,
      post_length: validated.post_length,
    });
  } catch (e) {
    await refundSessionLimit(validated.session_id);
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  try {
    const db = getDb();
    await db.collection("generations").add({
      session_id: validated.session_id,
      hashed_ip: hashed_ip ?? null,
      achievement: validated.achievement,
      drama_level: validated.drama_level,
      buzzword_density: validated.buzzword_density,
      post_length: validated.post_length,
      ai_output: output,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Firestore log failed", e);
    await refundSessionLimit(validated.session_id);
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
  }

  return NextResponse.json({
    ...output,
    remaining: limit.remaining,
  });
}
