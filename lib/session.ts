const KEY = "hypeitup_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id || id.length < 8) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
