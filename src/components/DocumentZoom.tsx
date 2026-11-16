import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, Expression } from "../art/Character";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal } from "../lib/util";
import type { Beat, Evidence } from "../schema";

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Cam = { zoom: number; px: number; py: number; hl: number };

/**
 * Show a real legal document and move a camera over it: open on the full page,
 * then zoom/pan to each highlighted passage and scribble a ring around it.
 *
 * Camera targets come from the scene's `beats` (action "focus", value = highlight
 * index, timed to a narration word). With no beats it sweeps the highlights evenly.
 */
export const DocumentZoom: React.FC<{
  evidence: Evidence & { imgW?: number; imgH?: number };
  beats: (Beat & { at: number })[];
  sceneDurationSec: number;
  accent: string;
  headline?: string;
  expression?: string;
}> = ({ evidence, beats, sceneDurationSec, accent, headline, expression }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const imgW = evidence.imgW ?? 1400;
  const imgH = evidence.imgH ?? 1800;

  // viewport sits to the right; the character examines it from the left
  const VPW = width - 620;
  const VPH = height - 420;
  const vpX = 470;
  const vpY = 140;

  // Fit the document to the viewport WIDTH so the text is readable; the page is
  // then taller than the viewport and the camera pans down it like a reader.
  const Wd = VPW;
  const Hd = (VPW * imgH) / imgW;

  const nHl = evidence.highlights.length;
  // open on the top of the document (masthead + first lines)
  const overview: Cam = { zoom: 1, px: 0, py: 0, hl: -1 };

  const camFor = (hlIndexRaw: number): Cam => {
    if (nHl === 0) return overview;
    const hlIndex = Math.max(0, Math.min(nHl - 1, hlIndexRaw));
    const h = evidence.highlights[hlIndex];
    const cxw = (h.x + h.w / 2) * Wd;
    const cyw = (h.y + h.h / 2) * Hd;
    // zoom so a thin highlighted line becomes comfortably large, but stay gentle
    const zoom = Math.max(1.3, Math.min(2.6, 150 / Math.max(14, h.h * Hd)));
    return { zoom, px: VPW / 2 - zoom * cxw, py: VPH / 2 - zoom * cyw, hl: hlIndex };
  };

  // Build camera keyframes over time
  const keys = useMemo(() => {
    const ks: { t: number; cam: Cam }[] = [{ t: 0, cam: overview }];
    const focusBeats = beats.filter((b) => b.action === "focus");
    if (focusBeats.length) {
      for (const b of focusBeats) ks.push({ t: b.at, cam: camFor(Number(b.value ?? 0)) });
    } else {
      // even sweep across highlights after a 1.2s overview
      const n = evidence.highlights.length;
      const start = 1.2;
      const span = Math.max(0.1, sceneDurationSec - start - 0.6);
      for (let i = 0; i < n; i++) {
        ks.push({ t: start + (span * i) / Math.max(1, n), cam: camFor(i) });
      }
    }
    return ks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(beats), JSON.stringify(evidence.highlights), sceneDurationSec]);

  // interpolate camera between the surrounding keyframes
  let ki = keys.filter((k) => k.t <= t).length - 1;
  if (ki < 0) ki = 0;
  const cur = keys[ki];
  const nxt = keys[Math.min(keys.length - 1, ki + 1)];
  const moveDur = 0.7;
  const p = nxt === cur ? 1 : easeInOut(interpolate(t, [cur.t, cur.t + moveDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cam: Cam = {
    zoom: interpolate(p, [0, 1], [cur.cam.zoom, nxt.cam.zoom]),
    px: interpolate(p, [0, 1], [cur.cam.px, nxt.cam.px]),
    py: interpolate(p, [0, 1], [cur.cam.py, nxt.cam.py]),
    hl: p > 0.5 ? nxt.cam.hl : cur.cam.hl,
  };

  const pageIn = reveal(frame, 0, 12);

  return (
    <AbsoluteFill>
      {/* headline */}
      {headline && (
        <div style={{ position: "absolute", top: 40, left: vpX, width: VPW, textAlign: "center", opacity: pageIn }}>
          <span style={{ fontFamily: anton, fontSize: 56, color: palette.ink }}>{headline}</span>
        </div>
      )}

      {/* character examining the document with a magnifier */}
      <svg width={470} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${30 + (1 - pageIn) * -160}, 430) scale(0.8)`} opacity={pageIn}>
          <Character pose="hold-right" expression={(expression as Expression) || "neutral"} shirt="#3b82f6" />
          {/* magnifier in the raised hand, tilted toward the page */}
          <g transform="translate(250, 250) scale(0.7) rotate(20)">
            <RoughShape shape={{ type: "circle", cx: 90, cy: 90, d: 130 }} seed={61} options={{ stroke: accent, strokeWidth: 9, fill: "rgba(255,255,255,0.3)", fillStyle: "solid", roughness: 1.4 }} />
            <RoughShape shape={{ type: "line", x1: 140, y1: 140, x2: 210, y2: 210 }} seed={62} options={{ stroke: palette.ink, strokeWidth: 16, roughness: 1.2 }} />
          </g>
        </g>
      </svg>

      {/* viewport */}
      <div
        style={{
          position: "absolute",
          left: vpX,
          top: vpY,
          width: VPW,
          height: VPH,
          overflow: "hidden",
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
          border: `2px solid ${palette.inkSoft}`,
          opacity: pageIn,
        }}
      >
        {/* world: image + highlight rings, moved by the camera */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: Wd,
            height: Hd,
            transformOrigin: "0 0",
            transform: `translate(${cam.px}px, ${cam.py}px) scale(${cam.zoom})`,
          }}
        >
          <Img src={staticFile(evidence.image)} style={{ width: Wd, height: Hd, display: "block" }} />
          <svg width={Wd} height={Hd} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {evidence.highlights.map((h, i) => {
              if (cam.hl !== i) return null;
              // draw the ring on when this highlight becomes active
              const activeKey = keys.find((k) => k.cam.hl === i);
              const ringDraw = activeKey ? reveal(t, activeKey.t + 0.3, activeKey.t + 0.9) : 1;
              return (
                <g key={i}>
                  <rect
                    x={h.x * Wd}
                    y={h.y * Hd}
                    width={h.w * Wd}
                    height={h.h * Hd}
                    fill={palette.highlight}
                    opacity={0.38 * ringDraw}
                  />
                  <RoughShape
                    shape={{ type: "rect", x: h.x * Wd - 10, y: h.y * Hd - 8, w: h.w * Wd + 20, h: h.h * Hd + 16 }}
                    seed={31 + i}
                    draw={ringDraw}
                    boil={5}
                    options={{ stroke: accent, strokeWidth: 5 / cam.zoom, roughness: 2, bowing: 2 }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* source citation card, bottom-left of the viewport */}
      <div
        style={{
          position: "absolute",
          left: vpX,
          top: vpY + VPH + 16,
          opacity: pageIn,
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: VPW,
        }}
      >
        <div style={{ background: accent, color: "#fff", fontFamily: inter, fontWeight: 800, fontSize: 20, padding: "6px 12px", borderRadius: 6, letterSpacing: 1 }}>
          SOURCE
        </div>
        <div style={{ fontFamily: inter, fontWeight: 600, fontSize: 24, color: palette.ink }}>
          {evidence.caption}
          <span style={{ color: palette.neutral, fontWeight: 500, fontSize: 20 }}>
            {"  —  "}
            {evidence.url.replace(/^https?:\/\//, "").slice(0, 60)} · accessed {evidence.accessed}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
