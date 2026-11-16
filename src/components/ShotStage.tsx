import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SmoothCharacter, Expression, Pose } from "../art/SmoothCharacter";
import { Prop, PropName } from "../art/props";
import { RoughShape } from "../lib/rough";
import { marker, hand, print, inter, palette } from "../lib/theme";
import { money, reveal } from "../lib/util";
import type { Evidence, RenderScene } from "../schema";

type Shot = {
  start: number; // scene-local frames
  dur: number;
  kind: string;
  text?: string;
  prop?: string;
  value?: number;
  label?: string;
  note?: string;
  hl?: number;
  color?: string;
  pose?: string;
  expr?: string;
  stamp?: boolean;
  icons?: string[];
  doc?: string;
};

const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// content area to the right of the corner character
const AREA = { x: 560, y: 150, w: 1260, h: 720 };
const cx = AREA.x + AREA.w / 2;
const cy = AREA.y + AREA.h / 2;

/* ----------------------------- shot renderers ----------------------------- */

const HeadlineShot: React.FC<{ shot: Shot; f: number; emphasis: string }> = ({ shot, f, emphasis }) => {
  const pop = easeOutBack(reveal(f, 0, 8));
  const ul = reveal(f, 6, 18);
  const text = shot.text ?? "";
  const w = Math.min(AREA.w, text.length * 44 + 80);
  return (
    <div style={{ position: "absolute", left: AREA.x, top: cy - 90, width: AREA.w, textAlign: "center", transform: `scale(${pop})` }}>
      <div style={{ fontFamily: marker, fontWeight: 800, fontSize: 96, lineHeight: 1.0, color: palette.ink }}>{text}</div>
      <svg width={w} height={28} style={{ overflow: "visible", marginTop: 6 }}>
        <RoughShape shape={{ type: "line", x1: 8, y1: 14, x2: w - 8, y2: 14 }} seed={4} draw={ul} options={{ stroke: emphasis, strokeWidth: 10, roughness: 1.3, bowing: 2 }} />
      </svg>
    </div>
  );
};

const PropShot: React.FC<{ shot: Shot; f: number; emphasis: string }> = ({ shot, f, emphasis }) => {
  const pop = easeOutBack(reveal(f, 0, 9));
  const draw = reveal(f, 2, 20);
  const idle = Math.sin(f * 0.06) * 10; // gentle float
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`translate(${cx}, ${cy + 20 + idle}) scale(${2.8 * Math.max(0.001, pop)})`}>
          <g transform="translate(-130,-115)">
            <Prop name={shot.prop as PropName} draw={draw} accent={emphasis} value={shot.value} day={shot.label} stamp={shot.stamp} />
          </g>
        </g>
      </svg>
      {shot.label && shot.label.length <= 16 && (
        <div style={{ position: "absolute", left: cx - 120, top: cy - 230, transform: `scale(${pop}) rotate(-3deg)` }}>
          <span style={{ background: palette.yellow, color: palette.ink, fontFamily: marker, fontWeight: 800, fontSize: 38, padding: "8px 22px", border: `3px solid ${palette.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 rgba(20,20,20,0.18)" }}>{shot.label}</span>
        </div>
      )}
    </>
  );
};

const NumberShot: React.FC<{ shot: Shot; f: number; fps: number; emphasis: string }> = ({ shot, f, fps, emphasis }) => {
  const pop = easeOutBack(reveal(f, 0, 8));
  const count = Math.round(interpolate(spring({ frame: f, fps, config: { damping: 16 } }), [0, 1], [0, shot.value ?? 0]));
  return (
    <div style={{ position: "absolute", left: AREA.x, top: cy - 160, width: AREA.w, textAlign: "center", transform: `scale(${pop}) rotate(-3deg)` }}>
      <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 230, lineHeight: 0.9, color: shot.color || emphasis }}>{money(count)}</div>
      {shot.label && <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 70, color: palette.inkSoft, marginTop: -8 }}>{shot.label}</div>}
    </div>
  );
};

const CiteShot: React.FC<{ shot: Shot; f: number; emphasis: string }> = ({ shot, f, emphasis }) => {
  const pop = easeOutBack(reveal(f, 0, 9));
  const draw = reveal(f, 2, 18);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`translate(${cx}, ${cy}) scale(${2.4 * Math.max(0.001, pop)})`}>
          <g transform="translate(-135,-115)"><Prop name="document" draw={draw} accent={emphasis} /></g>
        </g>
      </svg>
      <div style={{ position: "absolute", left: AREA.x, top: cy + 150, width: AREA.w, textAlign: "center", transform: `scale(${pop})` }}>
        <span style={{ fontFamily: marker, fontWeight: 800, fontSize: 52, color: palette.ink, background: palette.yellow, padding: "6px 18px", border: `3px solid ${palette.ink}`, borderRadius: 6 }}>§ {shot.text}</span>
      </div>
    </>
  );
};

const IconsShot: React.FC<{ shot: Shot; f: number; emphasis: string }> = ({ shot, f, emphasis }) => {
  const icons = shot.icons ?? [];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
      {icons.map((ic, i) => {
        const pop = easeOutBack(reveal(f, i * 5, i * 5 + 9));
        const x = cx - (icons.length - 1) * 170 + i * 340;
        return (
          <g key={i} transform={`translate(${x}, ${cy}) scale(${1.9 * Math.max(0.001, pop)})`}>
            <g transform="translate(-130,-115)"><Prop name={ic as PropName} draw={pop} accent={i % 2 ? palette.red : emphasis} /></g>
          </g>
        );
      })}
    </svg>
  );
};

const BubbleShot: React.FC<{ shot: Shot; f: number }> = ({ shot, f }) => {
  const pop = easeOutBack(reveal(f, 0, 10));
  const draw = reveal(f, 2, 16);
  const text = shot.text ?? "";
  const bw = Math.min(1100, Math.max(460, text.length * 20 + 160));
  const bh = Math.max(220, Math.ceil(text.length / 28) * 56 + 130);
  const bx = cx - bw / 2, by = cy - bh / 2 - 20;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`scale(${pop})`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <RoughShape shape={{ type: "rect", x: bx, y: by, w: bw, h: bh }} seed={5} draw={draw} options={{ stroke: palette.ink, strokeWidth: 6, roughness: 1.1, fill: "#fff", fillStyle: "solid" }} />
          {/* tail toward the corner character */}
          <RoughShape shape={{ type: "polygon", points: [[bx + 60, by + bh - 6], [bx + 10, by + bh + 70], [bx + 130, by + bh - 6]] }} seed={6} draw={draw} options={{ stroke: palette.ink, strokeWidth: 6, roughness: 1, fill: "#fff", fillStyle: "solid" }} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: bx + 40, top: by + 30, width: bw - 80, height: bh - 60, display: "flex", alignItems: "center", justifyContent: "center", opacity: reveal(f, 8, 18), transform: `scale(${pop})`, transformOrigin: `${cx}px ${cy}px` }}>
        <span style={{ fontFamily: marker, fontWeight: 700, fontSize: 48, lineHeight: 1.15, color: palette.ink, textAlign: "center" }}>{text}</span>
      </div>
    </>
  );
};

const StampShot: React.FC<{ shot: Shot; f: number }> = ({ shot, f }) => {
  const slam = interpolate(reveal(f, 0, 6), [0, 1], [2.6, 1]);
  const op = reveal(f, 0, 4);
  return (
    <div style={{ position: "absolute", left: AREA.x, top: cy - 70, width: AREA.w, textAlign: "center", opacity: op, transform: `scale(${slam}) rotate(-8deg)` }}>
      <span style={{ fontFamily: marker, fontWeight: 800, fontSize: 130, color: palette.red, border: `8px solid ${palette.red}`, padding: "6px 32px", borderRadius: 10 }}>{shot.text}</span>
    </div>
  );
};

const DocShot: React.FC<{ shot: Shot; f: number; ev?: Evidence & { imgW?: number; imgH?: number }; emphasis: string }> = ({ shot, f, ev, emphasis }) => {
  if (!ev) return null;
  const imgW = ev.imgW ?? 1400, imgH = ev.imgH ?? 1800;
  const VPW = AREA.w, VPH = AREA.h;
  const Wd = VPW, Hd = (VPW * imgH) / imgW;
  const hl = shot.hl != null ? ev.highlights[shot.hl] : undefined;
  const appear = reveal(f, 0, 7);
  let px = 0, py = 0, zoom = 1;
  if (hl) {
    const target = Math.max(1.3, Math.min(2.6, 150 / Math.max(14, hl.h * Hd)));
    const inProg = reveal(f, 2, 18);
    const drift = shot.dur ? Math.min(1, f / shot.dur) : 0; // slow continued push
    zoom = interpolate(inProg, [0, 1], [1.08, target]) * (1 + 0.1 * drift);
    px = VPW / 2 - zoom * (hl.x + hl.w / 2) * Wd;
    py = VPH / 2 - zoom * (hl.y + hl.h / 2) * Hd - drift * 10;
  } else {
    // no highlight: slow drift down the page
    const drift = shot.dur ? Math.min(1, f / shot.dur) : 0;
    zoom = 1.05;
    py = -drift * (Hd - VPH) * 0.25;
  }
  const ring = reveal(f, 14, 24);
  return (
    <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: VPW, height: VPH, overflow: "hidden", borderRadius: 10, background: "#fff", border: `3px solid ${palette.ink}`, boxShadow: "6px 8px 0 rgba(20,20,20,0.12)", opacity: appear }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: Wd, height: Hd, transformOrigin: "0 0", transform: `translate(${px}px, ${py}px) scale(${zoom})` }}>
        <Img src={staticFile(ev.image)} style={{ width: Wd, height: Hd, display: "block" }} />
        {hl && (
          <svg width={Wd} height={Hd} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <rect x={hl.x * Wd} y={hl.y * Hd} width={hl.w * Wd} height={hl.h * Hd} fill={palette.yellow} opacity={0.4 * ring} />
            <RoughShape shape={{ type: "rect", x: hl.x * Wd - 8, y: hl.y * Hd - 6, w: hl.w * Wd + 16, h: hl.h * Hd + 12 }} seed={7} draw={ring} options={{ stroke: emphasis, strokeWidth: 4 / zoom, roughness: 1.6 }} />
          </svg>
        )}
      </div>
      {shot.note && (
        <div style={{ position: "absolute", right: 24, bottom: 20, fontFamily: hand, fontWeight: 700, fontSize: 70, color: palette.red, transform: "rotate(-5deg)" }}>{shot.note}</div>
      )}
    </div>
  );
};

/* ------------------------------- the stage -------------------------------- */

export const ShotStage: React.FC<{ scene: RenderScene; evidence: (Evidence & { imgW?: number; imgH?: number })[]; accent: string }> = ({ scene, evidence, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shots = (scene.shots ?? []) as Shot[];
  const emphasis = scene.ledgerState === "red" ? palette.red : scene.ledgerState === "gold" ? palette.green : accent;

  const active = shots.filter((s) => frame >= s.start).slice(-1)[0] ?? shots[0];
  const f = active ? frame - active.start : 0;

  // persistent corner character, reacts with the active shot's expression if set
  const pose: Pose = (active?.pose as Pose) || (scene.pose as Pose) || "point-right";
  const expr: Expression = (active?.expr as Expression) || (scene.expression as Expression) || "neutral";
  const charEnter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  const ev = active?.doc ? evidence.find((e) => e.id === active.doc) : undefined;

  return (
    <AbsoluteFill>
      {/* persistent corner character */}
      <svg width={560} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${40 + (1 - charEnter) * -200}, 430) scale(0.72)`} opacity={charEnter}>
          <SmoothCharacter pose={pose} expression={expr} pointer={pose.startsWith("point") || pose === "hold-right"} />
        </g>
      </svg>

      {/* the active shot */}
      {active && active.kind === "headline" && <HeadlineShot shot={active} f={f} emphasis={emphasis} />}
      {active && active.kind === "prop" && <PropShot shot={active} f={f} emphasis={emphasis} />}
      {active && active.kind === "number" && <NumberShot shot={active} f={f} fps={fps} emphasis={emphasis} />}
      {active && active.kind === "cite" && <CiteShot shot={active} f={f} emphasis={emphasis} />}
      {active && active.kind === "icons" && <IconsShot shot={active} f={f} emphasis={emphasis} />}
      {active && active.kind === "stamp" && <StampShot shot={active} f={f} />}
      {active && active.kind === "bubble" && <BubbleShot shot={active} f={f} />}
      {active && active.kind === "doc" && <DocShot shot={active} f={f} ev={ev} emphasis={emphasis} />}
    </AbsoluteFill>
  );
};
