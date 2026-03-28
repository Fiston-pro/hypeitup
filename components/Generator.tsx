"use client";

import { useCallback, useEffect, useState } from "react";
import type { BuzzwordDensity, ModalResponse, PostLength } from "@/lib/types";
import { getOrCreateSessionId } from "@/lib/session";
import { ExamplePrompts } from "./ExamplePrompts";
import { HypeLogo } from "./HypeLogo";
import { OutputCard } from "./OutputCard";

const CONTACT_MAIL = "mailto:byiringiroetienne2@gmail.com?subject=HypeItUp%20access";

export function Generator() {
  const [achievement, setAchievement] = useState("");
  const [dramaLevel, setDramaLevel] = useState(7);
  const [buzzwordDensity, setBuzzwordDensity] = useState<BuzzwordDensity>("medium");
  const [postLength, setPostLength] = useState<PostLength>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{
    achievement: string;
    output: ModalResponse;
    remaining: number;
  } | null>(null);

  const refreshRemaining = useCallback(async () => {
    const sid = getOrCreateSessionId();
    if (!sid) return;
    try {
      const res = await fetch(`/api/remaining?session_id=${encodeURIComponent(sid)}`);
      const data = (await res.json()) as { remaining?: number };
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch {
      setRemaining(null);
    }
  }, []);

  useEffect(() => {
    void refreshRemaining();
  }, [refreshRemaining]);

  const generate = useCallback(async () => {
    setError(null);
    setLimitMessage(null);
    const trimmed = achievement.trim();
    if (!trimmed) {
      setError("Type a tiny achievement first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const session_id = getOrCreateSessionId();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievement: trimmed,
          drama_level: dramaLevel,
          buzzword_density: buzzwordDensity,
          post_length: postLength,
          session_id,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimitMessage(
          typeof data.message === "string"
            ? data.message
            : "You've hit your 5 free posts today. Need more access? Write to me.",
        );
        setRemaining(0);
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      const output: ModalResponse = {
        hook: data.hook,
        body: data.body,
        hashtags: data.hashtags,
        cringe_score: data.cringe_score,
        share_title: data.share_title,
      };
      setResult({
        achievement: trimmed,
        output,
        remaining: typeof data.remaining === "number" ? data.remaining : 0,
      });
      setRemaining(typeof data.remaining === "number" ? data.remaining : 0);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [achievement, buzzwordDensity, dramaLevel, postLength]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8 md:max-w-xl">
      <header className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <HypeLogo />
        </div>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          Turn small wins into{" "}
          <span className="text-[#f5c842]">LinkedIn legend</span>
        </h1>
        <p className="mt-3 text-sm text-white/55">
          Straight-faced. Absurd. Screenshot-ready.
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
        <span className="text-white/60">Free posts left today</span>
        <span className="font-mono font-bold text-[#f5c842]">
          {remaining === null ? "…" : remaining}
        </span>
      </div>

      <ExamplePrompts
        disabled={loading}
        onPick={(text) => {
          setAchievement(text);
          setError(null);
        }}
      />

      <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-[#111]/60 p-5 backdrop-blur">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Your achievement
          </span>
          <textarea
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            placeholder="e.g. I finally cleared my inbox"
            rows={3}
            maxLength={500}
            disabled={loading}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-[#f5c842]/50 focus:outline-none focus:ring-1 focus:ring-[#f5c842]/30 disabled:opacity-50"
          />
        </label>

        <div>
          <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-white/40">
            <span>Drama level</span>
            <span className="font-mono text-[#f5c842]">{dramaLevel}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={dramaLevel}
            onChange={(e) => setDramaLevel(Number(e.target.value))}
            disabled={loading}
            className="mt-2 h-2 w-full cursor-pointer accent-[#f5c842]"
          />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Buzzword density
          </span>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["low", "Low"],
                ["medium", "Medium"],
                ["max", "MAX"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                disabled={loading}
                onClick={() => setBuzzwordDensity(v)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  buzzwordDensity === v
                    ? "border-[#f5c842] bg-[#f5c842]/15 text-[#f5c842]"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Post length
          </span>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["short", "Short"],
                ["medium", "Medium"],
                ["long", "Long"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                disabled={loading}
                onClick={() => setPostLength(v)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  postLength === v
                    ? "border-[#f5c842] bg-[#f5c842]/15 text-[#f5c842]"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c842] py-3.5 text-base font-bold text-black transition hover:bg-[#e6b93a] disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              Generating…
            </>
          ) : (
            "Generate hype"
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {limitMessage && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#f5c842]/30 bg-[#f5c842]/10 px-4 py-4 text-sm text-white/90">
          <p>{limitMessage}</p>
          <a
            href={CONTACT_MAIL}
            className="inline-flex rounded-lg bg-[#f5c842] px-4 py-2 text-sm font-bold text-black hover:bg-[#e6b93a]"
          >
            Request more access
          </a>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h2 className="mb-3 font-heading text-lg font-bold text-white">Your post</h2>
          <OutputCard achievement={result.achievement} output={result.output} />
          <p className="mt-4 text-center text-xs text-white/40">
            {result.remaining} free {result.remaining === 1 ? "post" : "posts"} left today
          </p>
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-white/35">
        Parody generator · Not affiliated with LinkedIn
      </footer>
    </div>
  );
}
