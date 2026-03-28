"use client";

import { forwardRef } from "react";
import type { ModalResponse } from "@/lib/types";

type Props = {
  achievement: string;
  output: ModalResponse;
};

/** Fixed 1200×630 canvas for social-style export (hidden off-screen). */
export const ExportCard = forwardRef<HTMLDivElement, Props>(function ExportCard(
  { achievement, output },
  ref,
) {
  const tags = output.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");

  return (
    <div
      ref={ref}
      className="box-border flex flex-col justify-between bg-[#0a0a0a] p-10 text-[#f4f4f5]"
      style={{
        width: 1200,
        height: 630,
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#f5c842] bg-[#f5c842]/10 text-2xl font-bold text-[#f5c842]">
            H
          </span>
          <div>
            <p
              className="text-3xl font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
            >
              Hype<span className="text-[#f5c842]">It</span>Up
            </p>
            <p className="text-sm text-white/50">Your tiny win. Their existential crisis.</p>
          </div>
        </div>
        <p className="rounded-full border border-[#f5c842]/40 bg-[#f5c842]/10 px-4 py-2 text-sm font-semibold text-[#f5c842]">
          Cringe {Math.round(output.cringe_score)}/100
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Reality</p>
          <p className="mt-2 text-xl text-white/80">{achievement}</p>
        </div>
        <div className="rounded-2xl border border-[#f5c842]/25 bg-[#141414] p-6">
          <p className="text-sm font-semibold text-[#f5c842]">{output.hook}</p>
          <p className="mt-3 text-lg leading-relaxed text-white/95">{output.body}</p>
          <p className="mt-4 text-sm text-[#a3a3a3]">{tags}</p>
        </div>
      </div>

      <p className="text-center text-xs text-white/35">HypeItUp · generated satire</p>
    </div>
  );
});
