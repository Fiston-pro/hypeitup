import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { getDb } from "@/lib/firebase-admin";

type DayBucket = { date: string; count: number };

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const gen = db.collection("generations");

    const totalSnap = await gen.count().get();
    const total = totalSnap.data().count;

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const recent = await gen.where("timestamp", ">=", start).get();
    const byDay = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    recent.forEach((doc) => {
      const ts = doc.get("timestamp");
      if (ts && typeof ts.toDate === "function") {
        const dateStr = ts.toDate().toISOString().slice(0, 10);
        byDay.set(dateStr, (byDay.get(dateStr) ?? 0) + 1);
      }
    });

    const last14Days: DayBucket[] = Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const feedSnap = await gen.orderBy("timestamp", "desc").limit(40).get();
    const feed = feedSnap.docs.map((d) => {
      const data = d.data();
      const ts = data.timestamp;
      const time =
        ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null;
      return {
        id: d.id,
        time,
        achievement: String(data.achievement ?? "").slice(0, 120),
        drama_level: data.drama_level,
        buzzword_density: data.buzzword_density,
        post_length: data.post_length,
      };
    });

    const settingsAgg = { drama: {} as Record<string, number>, buzz: {} as Record<string, number>, length: {} as Record<string, number> };
    recent.forEach((doc) => {
      const data = doc.data();
      const dr = String(data.drama_level ?? "");
      settingsAgg.drama[dr] = (settingsAgg.drama[dr] ?? 0) + 1;
      const bz = String(data.buzzword_density ?? "");
      settingsAgg.buzz[bz] = (settingsAgg.buzz[bz] ?? 0) + 1;
      const pl = String(data.post_length ?? "");
      settingsAgg.length[pl] = (settingsAgg.length[pl] ?? 0) + 1;
    });

    return NextResponse.json({
      total,
      last14Days,
      settings_last_14_days: settingsAgg,
      feed,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
