"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  total: number;
  last14Days: { date: string; count: number }[];
  settings_last_14_days: {
    drama: Record<string, number>;
    buzz: Record<string, number>;
    length: Record<string, number>;
  };
  feed: {
    id: string;
    time: string | null;
    achievement: string;
    drama_level: unknown;
    buzzword_density: unknown;
    post_length: unknown;
  }[];
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        setAuthed(false);
        setStats(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setAuthed(true);
      setStats(data as Stats);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password");
        return;
      }
      setPassword("");
      await load();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setStats(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">HypeItUp admin</h1>
          <Link href="/" className="text-sm text-[#f5c842] hover:underline">
            ← Home
          </Link>
        </div>

        {!authed && (
          <form onSubmit={login} className="max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#111] p-6">
            <label className="block text-sm text-white/60">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-black disabled:opacity-50"
            >
              {loading ? "…" : "Sign in"}
            </button>
          </form>
        )}

        {authed && stats && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void logout()}
                className="text-sm text-white/50 hover:text-white"
              >
                Log out
              </button>
            </div>

            <section className="rounded-xl border border-white/10 bg-[#111] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Totals</h2>
              <p className="mt-2 font-heading text-3xl font-bold text-[#f5c842]">{stats.total}</p>
              <p className="text-sm text-white/50">generations logged (all time)</p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#111] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
                Last 14 days (requests per day)
              </h2>
              <ul className="mt-3 max-h-48 overflow-auto font-mono text-sm">
                {stats.last14Days.map((d) => (
                  <li key={d.date} className="flex justify-between border-b border-white/5 py-1">
                    <span className="text-white/70">{d.date}</span>
                    <span>{d.count}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#111] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
                Settings (last 14 days, rough)
              </h2>
              <div className="mt-3 grid gap-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-white/50">Drama level</p>
                  <pre className="mt-1 overflow-auto text-xs text-white/80">
                    {JSON.stringify(stats.settings_last_14_days.drama, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-white/50">Buzzwords</p>
                  <pre className="mt-1 overflow-auto text-xs text-white/80">
                    {JSON.stringify(stats.settings_last_14_days.buzz, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-white/50">Length</p>
                  <pre className="mt-1 overflow-auto text-xs text-white/80">
                    {JSON.stringify(stats.settings_last_14_days.length, null, 2)}
                  </pre>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
                  Recent requests
                </h2>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-xs text-[#f5c842] hover:underline"
                >
                  Refresh
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {stats.feed.map((row) => (
                  <li key={row.id} className="rounded-lg border border-white/5 bg-[#0a0a0a] px-3 py-2">
                    <p className="text-xs text-white/40">{row.time ?? row.id}</p>
                    <p className="text-white/90">{row.achievement}</p>
                    <p className="text-xs text-white/50">
                      drama {String(row.drama_level)} · {String(row.buzzword_density)} ·{" "}
                      {String(row.post_length)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {loading && authed && !stats && <p className="text-white/50">Loading…</p>}
        {error && authed && <p className="text-red-400">{error}</p>}
      </div>
    </div>
  );
}
