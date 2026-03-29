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
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const makeDataUrl = useCallback(async (): Promise<string> => {
    const node = exportRef.current;
    if (!node) throw new Error("Nothing to export");
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }
    return toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#0a0a0a",
    });
  }, []);

  const openPreview = useCallback(async () => {
    setBusy("share");
    try {
      const dataUrl = await makeDataUrl();
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error(e);
      alert("Could not render image. Try again.");
    } finally {
      setBusy(null);
    }
  }, [makeDataUrl]);

  const download = useCallback(async (dataUrl?: string) => {
    try {
      const url = dataUrl ?? (await makeDataUrl());
      const a = document.createElement("a");
      a.href = url;
      a.download = `hypeitup-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Could not create image. Try again.");
    }
  }, [makeDataUrl]);

  const shareImage = useCallback(async () => {
    if (!previewUrl) return;
    setBusy("share");
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], "hypeitup.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: output.share_title || "HypeItUp", text: "Made with HypeItUp" });
      } else if (navigator.share) {
        await navigator.share({ title: output.share_title || "HypeItUp", text: `${output.hook}\n\n(Made with HypeItUp)` });
      } else {
        await download(previewUrl);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await download(previewUrl);
    } finally {
      setBusy(null);
    }
  }, [previewUrl, output.share_title, output.hook, download]);

  const copyText = useCallback(async () => {
    const text = `${output.hook}\n\n${output.body}\n\n${output.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

      {/* Post card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#f5c842]/40 bg-gradient-to-br from-[#1a1508] to-[#0a0a0a] p-6 shadow-[0_0_40px_-10px_rgba(245,200,66,0.35)]">
        {/* Copy icon in top-right */}
        <button
          type="button"
          onClick={() => void copyText()}
          title="Copy post text"
          className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5c842]">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

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

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void openPreview()}
          className="flex-1 rounded-xl border border-[#f5c842]/50 bg-[#f5c842]/15 px-4 py-2.5 text-sm font-semibold text-[#f5c842] transition hover:bg-[#f5c842]/25 disabled:opacity-50"
        >
          {busy === "share" ? "Rendering…" : "Share image"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void download()}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy === "download" ? "Working…" : "Download"}
        </button>
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white/60 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Preview image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of your HypeItUp post"
              className="w-full object-contain"
              style={{ maxHeight: "65vh" }}
            />

            {/* Actions */}
            <div className="flex gap-2 p-4">
              <button
                type="button"
                disabled={busy === "share"}
                onClick={() => void shareImage()}
                className="flex-1 rounded-xl bg-[#f5c842] py-2.5 text-sm font-bold text-black transition hover:bg-[#e6b93a] disabled:opacity-50"
              >
                {busy === "share" ? "Sharing…" : "Share"}
              </button>
              <button
                type="button"
                onClick={() => void download(previewUrl)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden export canvas */}
      <div className="pointer-events-none fixed -left-[10000px] top-0 opacity-0">
        <ExportCard ref={exportRef} achievement={achievement} output={output} />
      </div>
    </div>
  );
}
