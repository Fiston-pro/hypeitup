"use client";

import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { ModalResponse } from "@/lib/types";
import { ExportCard } from "./ExportCard";

function cringeLabel(score: number): string {
  if (score >= 85) return "Certified Timeline Poison";
  if (score >= 65) return "Heavy Cringe";
  if (score >= 45) return "Solid Cringe";
  return "Mild Cringe";
}

type Props = {
  achievement: string;
  output: ModalResponse;
};

export function OutputCard({ achievement, output }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "share" | "download">(null);

  const makeFile = useCallback(async (): Promise<{ dataUrl: string; blob: Blob }> => {
    const node = exportRef.current;
    if (!node) throw new Error("Nothing to export");
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#0a0a0a",
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return { dataUrl, blob };
  }, []);

  const download = useCallback(async () => {
    setBusy("download");
    try {
      const { dataUrl } = await makeFile();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hypeitup-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Could not create image. Try again.");
    } finally {
      setBusy(null);
    }
  }, [makeFile]);

  const share = useCallback(async () => {
    setBusy("share");
    try {
      const { blob } = await makeFile();
      const file = new File([blob], "hypeitup.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: output.share_title || "HypeItUp",
          text: "Made with HypeItUp",
        });
      } else if (navigator.share) {
        await navigator.share({
          title: output.share_title || "HypeItUp",
          text: `${output.hook}\n\n(Made with HypeItUp)`,
        });
      } else {
        await download();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error(e);
      try {
        await download();
      } catch {
        alert("Sharing is not available on this device.");
      }
    } finally {
      setBusy(null);
    }
  }, [download, makeFile, output.hook, output.share_title]);

  const copyText = useCallback(async () => {
    const text = `${output.hook}\n\n${output.body}\n\n${output.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Copy failed — select and copy manually.");
    }
  }, [output]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Reality</p>
        <p className="mt-1 text-sm text-white/80">{achievement}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-[#f5c842]/40 bg-gradient-to-br from-[#1a1508] to-[#0a0a0a] p-6 shadow-[0_0_40px_-10px_rgba(245,200,66,0.35)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#f5c842] px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
            {cringeLabel(output.cringe_score)}
          </span>
          <span className="text-xs text-white/50">Score {Math.round(output.cringe_score)}/100</span>
        </div>
        <p className="font-heading text-lg font-semibold leading-snug text-[#f5c842] md:text-xl">
          {output.hook}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/95">{output.body}</p>
        <p className="mt-4 text-sm text-[#a3a3a3]">
          {output.hashtags.map((t) => (
            <span key={t} className="mr-2">
              {t.startsWith("#") ? t : `#${t}`}
            </span>
          ))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyText()}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Copy text
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void share()}
          className="rounded-xl border border-[#f5c842]/50 bg-[#f5c842]/15 px-4 py-2.5 text-sm font-semibold text-[#f5c842] transition hover:bg-[#f5c842]/25 disabled:opacity-50"
        >
          {busy === "share" ? "Working…" : "Share image"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void download()}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy === "download" ? "Working…" : "Download image"}
        </button>
      </div>

      <div className="pointer-events-none fixed -left-[10000px] top-0 opacity-0">
        <ExportCard ref={exportRef} achievement={achievement} output={output} />
      </div>
    </div>
  );
}
