import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { anton, inter, palette } from "../lib/theme";
import { money } from "../lib/util";
import type { RenderScene } from "../schema";

const stateColor: Record<string, string> = {
  neutral: palette.neutral,
  gold: palette.gold,
  red: palette.red,
};

export const Hud: React.FC<{
  scenes: RenderScene[];
  series: string;
  jurisdiction: string;
  accent: string;
}> = ({ scenes, series, jurisdiction, accent }) => {
  const frame = useCurrentFrame();

  // --- running ledger ---
  const ledgerKeys = scenes
    .filter((s) => s.ledger != null)
    .map((s) => ({ f: s.startFrame as number, v: s.ledger as number, state: s.ledgerState ?? "neutral" }));

  let value = 0;
  let color = palette.neutral;
  let showLedger = false;
  if (ledgerKeys.length) {
    const idx = Math.max(0, ledgerKeys.filter((k) => k.f <= frame).length - 1);
    const cur = ledgerKeys[idx];
    showLedger = frame >= ledgerKeys[0].f;
    const prev = idx > 0 ? ledgerKeys[idx - 1] : { v: 0, f: cur.f };
    value = interpolate(frame, [cur.f, cur.f + 16], [prev.v, cur.v], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    color = stateColor[cur.state] ?? palette.neutral;
  }

  // --- chapter ladder ---
  const chapters = scenes.map((s) => s.chapter).filter((c): c is number => c != null);
  const totalChapters = chapters.length ? Math.max(...chapters) : 0;
  const activeScene = [...scenes].reverse().find((s) => (s.startFrame as number) <= frame);
  const curChapter = activeScene?.chapter ?? 0;

  return (
    <>
      {/* top-left: series chip + jurisdiction */}
      <div style={{ position: "absolute", top: 46, left: 70, display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            background: accent,
            color: "#fff",
            fontFamily: inter,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: 8,
          }}
        >
          {series}
        </div>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 700,
            fontSize: 22,
            color: palette.inkSoft,
            border: `2px solid ${palette.inkSoft}`,
            padding: "6px 14px",
            borderRadius: 8,
          }}
        >
          {jurisdiction}
        </div>
      </div>

      {/* bottom-left: chapter ladder (above the footer) */}
      {totalChapters > 0 && (
        <div style={{ position: "absolute", bottom: 34, left: 70, display: "flex", gap: 10, alignItems: "center" }}>
          {Array.from({ length: totalChapters }).map((_, i) => {
            const done = i < curChapter;
            return (
              <div key={i} style={{ width: done ? 34 : 22, height: 10, borderRadius: 6, background: done ? accent : "rgba(23,18,13,0.14)" }} />
            );
          })}
        </div>
      )}

      {/* ledger strip: running balance, top-right */}
      {showLedger && (
        <div
          style={{
            position: "absolute",
            top: 42,
            right: 66,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            background: "#fff",
            border: `3px solid ${color}`,
            borderRadius: 14,
            padding: "8px 20px",
            boxShadow: "0 5px 0 rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ fontFamily: inter, fontWeight: 800, fontSize: 17, letterSpacing: 1, color: palette.inkSoft, textTransform: "uppercase" }}>
            Balance
          </span>
          <span style={{ fontFamily: anton, fontSize: 40, color, lineHeight: 1 }}>{money(value)}</span>
        </div>
      )}
    </>
  );
};
