"use client";

import { forwardRef } from "react";
import type { ModalResponse } from "@/lib/types";

type Props = {
  achievement: string;
  output: ModalResponse;
};

/** Portrait 1080×1350 canvas for mobile/Instagram-style export (hidden off-screen). */
export const ExportCard = forwardRef<HTMLDivElement, Props>(function ExportCard(
  { achievement, output },
  ref,
) {
  const tags = output.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");

  return (
    <div
      ref={ref}
      className="box-border flex flex-col bg-[#0a0a0a] text-[#f4f4f5]"
      style={{
        width: 1080,
        height: 1350,
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        padding: 64,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-8">
        <div className="flex items-center gap-4">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              border: "2px solid #f5c842",
              background: "rgba(245,200,66,0.1)",
              fontSize: 28,
              fontWeight: 900,
              color: "#f5c842",
            }}
          >
            H
          </span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-syne), system-ui, sans-serif",
                fontSize: 36,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Hype<span style={{ color: "#f5c842" }}>It</span>Up
            </p>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
              Your tiny win. Their existential crisis.
            </p>
          </div>
        </div>
        <div
          style={{
            border: "1px solid rgba(245,200,66,0.4)",
            background: "rgba(245,200,66,0.1)",
            borderRadius: 999,
            padding: "10px 20px",
            fontSize: 16,
            fontWeight: 600,
            color: "#f5c842",
          }}
        >
          Cringe {Math.round(output.cringe_score)}/100
        </div>
      </div>

      {/* Reality */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
          Reality
        </p>
        <p style={{ marginTop: 10, fontSize: 22, color: "rgba(255,255,255,0.75)" }}>
          {achievement}
        </p>
      </div>

      {/* Post */}
      <div
        style={{
          marginTop: 36,
          flex: 1,
          borderRadius: 24,
          border: "1px solid rgba(245,200,66,0.25)",
          background: "#141414",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-syne), system-ui, sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#f5c842",
            lineHeight: 1.3,
          }}
        >
          {output.hook}
        </p>
        <p style={{ fontSize: 22, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", flex: 1 }}>
          {output.body}
        </p>
        <p style={{ fontSize: 17, color: "#a3a3a3", marginTop: "auto" }}>{tags}</p>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 32 }}>
        HypeItUp · generated satire · hypeitup.vercel.app
      </p>
    </div>
  );
});
