import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";

const DAILY_LIMIT = 5;
const COLLECTION = "rate_limits";

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Firestore-backed daily limit per session (authoritative).
 * Returns { allowed, remaining }.
 */
export async function checkAndConsumeSessionLimit(sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  if (!sessionId || sessionId.length < 8) {
    return { allowed: false, remaining: 0 };
  }
  const db = getDb();
  const docId = `${sessionId}_${dayKey()}`;
  const ref = db.collection(COLLECTION).doc(docId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data()?.count as number) ?? 0 : 0;
    if (current >= DAILY_LIMIT) {
      return { allowed: false as const, remaining: 0 };
    }
    const next = current + 1;
    tx.set(
      ref,
      {
        session_id: sessionId,
        date: dayKey(),
        count: next,
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { allowed: true as const, remaining: DAILY_LIMIT - next };
  });

  return result;
}

/** If generation failed after a slot was consumed, release one try back (best-effort). */
export async function refundSessionLimit(sessionId: string): Promise<void> {
  if (!sessionId || sessionId.length < 8) return;
  const db = getDb();
  const docId = `${sessionId}_${dayKey()}`;
  const ref = db.collection(COLLECTION).doc(docId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = (snap.data()?.count as number) ?? 0;
    if (current <= 0) return;
    tx.set(
      ref,
      {
        count: current - 1,
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/** Read-only remaining tries without consuming (for UI). */
export async function getSessionRemaining(sessionId: string): Promise<number> {
  if (!sessionId || sessionId.length < 8) return DAILY_LIMIT;
  const db = getDb();
  const docId = `${sessionId}_${dayKey()}`;
  const snap = await db.collection(COLLECTION).doc(docId).get();
  const current = snap.exists ? (snap.data()?.count as number) ?? 0 : 0;
  return Math.max(0, DAILY_LIMIT - current);
}
