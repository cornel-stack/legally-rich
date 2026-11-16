import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { print, palette } from "../lib/theme";

type W = { t: number; d: number; w: string };

function chunkWords(words: W[]): W[][] {
  const chunks: W[][] = [];
  let cur: W[] = [];
  for (let i = 0; i < words.length; i++) {
    const prev = words[i - 1];
    const gap = prev ? words[i].t - (prev.t + prev.d) : 0;
    if (cur.length >= 5 || (cur.length >= 3 && gap > 0.42)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(words[i]);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

/**
 * Subtle captions — small neat handwriting on a soft chip, low in the frame, so
 * they support the narration without the heavy TV lower-third we had before.
 */
export const Captions: React.FC<{ words: W[]; accent: string }> = ({ words, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => chunkWords(words), [words]);
  if (!chunks.length) return null;

  let active = chunks.findIndex((c) => t >= c[0].t && t <= c[c.length - 1].t + c[c.length - 1].d + 0.25);
  if (active < 0) active = Math.max(0, chunks.filter((c) => c[0].t <= t).length - 1);
  const chunk = chunks[active];
  const appear = Math.min(1, Math.max(0, (t - chunk[0].t + 0.12) / 0.16));

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          opacity: appear,
          transform: `translateY(${(1 - appear) * 10}px)`,
          background: "rgba(255,255,255,0.9)",
          border: `2px solid ${palette.ink}`,
          borderRadius: 16,
          padding: "8px 26px",
          boxShadow: "3px 4px 0 rgba(20,20,20,0.12)",
        }}
      >
        <span style={{ fontFamily: print, fontSize: 42, color: palette.ink, lineHeight: 1.1 }}>
          {chunk.map((w, i) => {
            const spoken = t >= w.t;
            const isActive = t >= w.t && t < w.t + w.d + 0.05;
            return (
              <span key={i} style={{ color: isActive ? accent : palette.ink, opacity: spoken ? 1 : 0.5 }}>
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
