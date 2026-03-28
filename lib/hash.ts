import { createHash } from "crypto";

/** SHA-256 of salt + IP for storage and correlation without storing raw IPs. */
export function hashIp(ip: string | null | undefined, salt: string | undefined): string | null {
  if (!ip || !salt) return null;
  const normalized = ip.trim().split(",")[0]?.trim() ?? "";
  if (!normalized) return null;
  return createHash("sha256").update(`${salt}|${normalized}`, "utf8").digest("hex");
}
