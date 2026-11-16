import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { archivo, palette } from "../lib/theme";

type W = { t: number; d: number; w: string };

/** Group words into short phrases, breaking on long pauses or every ~6 words. */
function chunkWords(words: W[]): W[][] {
  const chunks: W[][] = [];
  let cur: W[] = [];
  for (let i = 0; i < words.length; i++) {
    const prev = words[i - 1];
    const gap = prev ? words[i].t - (prev.t + prev.d) : 0;
    if (cur.length >= 6 || (cur.length >= 3 && gap > 0.42)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(words[i]);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export const Captions: React.FC<{ words: W[]; accent: string }> = ({ words, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const chunks = useMemo(() => chunkWords(words), [words]);
  if (chunks.length === 0) return null;

  // active chunk = the one whose time range covers t (or the last that started)
  let active = chunks.findIndex((c) => t >= c[0].t && t <= c[c.length - 1].t + c[c.length - 1].d + 0.25);
  if (active < 0) {
    // between chunks: hold the previous one briefly
    active = chunks.filter((c) => c[0].t <= t).length - 1;
  }
  if (active < 0) active = 0;
  const chunk = chunks[active];

  // fade each chunk in quickly
  const appear = Math.min(1, Math.max(0, (t - chunk[0].t + 0.12) / 0.18));

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 150,
        display: "flex",
        justifyContent: "center",
        padding: "0 160px",
      }}
    >
      <div
        style={{
          opacity: appear,
          transform: `translateY(${(1 - appear) * 14}px)`,
          background: "rgba(23,18,13,0.86)",
          borderRadius: 18,
          padding: "18px 34px",
          maxWidth: 1400,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            fontFamily: archivo,
            fontSize: 52,
            lineHeight: 1.18,
            letterSpacing: 0.3,
            color: "#fff",
          }}
        >
          {chunk.map((w, i) => {
            const spoken = t >= w.t;
            const isActive = t >= w.t && t < w.t + w.d + 0.05;
            return (
              <span
                key={i}
                style={{
                  color: isActive ? accent : "#fff",
                  opacity: spoken ? 1 : 0.55,
                  transition: "none",
                }}
              >
                {w.w}
                {i < chunk.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
};
