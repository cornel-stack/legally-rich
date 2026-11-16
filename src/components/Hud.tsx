import React from "react";
import { useCurrentFrame } from "remotion";
import { marker, print, palette } from "../lib/theme";
import type { RenderScene } from "../schema";

/**
 * Minimal, on-style chrome: a small hand-written channel wordmark and a chapter
 * progress tick row. The running balance now lives in-scene as a hand-written
 * note, so there is no UI pill competing with the art.
 */
export const Hud: React.FC<{ scenes: RenderScene[]; series: string; jurisdiction: string; accent: string }> = ({ scenes, jurisdiction, accent }) => {
  const frame = useCurrentFrame();

  const chapters = scenes.map((s) => s.chapter).filter((c): c is number => c != null);
  const totalChapters = chapters.length ? Math.max(...chapters) : 0;
  const activeScene = [...scenes].reverse().find((s) => (s.startFrame as number) <= frame);
  const curChapter = activeScene?.chapter ?? 0;

  return (
    <>
      {/* channel wordmark, top-left */}
      <div style={{ position: "absolute", top: 40, left: 64, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: marker, fontWeight: 800, fontSize: 34, color: palette.ink }}>Legally Rich</span>
        <span style={{ fontFamily: print, fontSize: 24, color: palette.inkSoft }}>· {jurisdiction}</span>
      </div>

      {/* chapter ticks, bottom-left */}
      {totalChapters > 0 && (
        <div style={{ position: "absolute", bottom: 34, left: 64, display: "flex", gap: 9, alignItems: "center" }}>
          {Array.from({ length: totalChapters }).map((_, i) => (
            <div key={i} style={{ width: i < curChapter ? 30 : 18, height: 8, borderRadius: 5, background: i < curChapter ? accent : "rgba(20,20,20,0.12)" }} />
          ))}
        </div>
      )}
    </>
  );
};
