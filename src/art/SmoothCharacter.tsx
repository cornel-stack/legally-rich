import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * "Jake" v2 — a smooth, confident hand-drawn doodle in the Casual-Finance register.
 *
 * Study notes that drive this design:
 *  - HUGE oval head (~45% of total height) on a thin single-line stick body.
 *  - Pale peach skin (#fcd5b5), pure-black messy hair, tiny dot eyes + a simple
 *    smile. Minimal face, maximal expression.
 *  - Lines are SMOOTH and confident (one organic stroke with a little wobble) —
 *    not the scratchy multi-stroke "boil" of raw Rough.js.
 *  - When he points, he holds a pointer stick into the content.
 *
 * Local box is 360 x 620 (feet on the ground at y≈600, centred on x=180). The
 * scene scales/places him with a wrapping <g transform>.
 */

export type Pose = "idle" | "point-right" | "point-left" | "hold-right" | "present" | "cheer" | "worried" | "shrug" | "walk";
export type Expression = "neutral" | "happy" | "worried" | "shocked" | "sad";

const INK = "#141414";
const SKIN = "#fcd5b5";
const HAIR = "#161616";

// deterministic tiny jitter
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// smooth closed blob through jittered points around an ellipse (organic but clean)
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.06, n = 16): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 1 + (rnd(seed + i) - 0.5) * 2 * wobble;
    pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
  }
  return catmull(pts, true);
}

// Catmull-Rom spline -> cubic bezier path
function catmull(p: [number, number][], closed: boolean): string {
  if (p.length < 2) return "";
  const pts = closed ? [p[p.length - 1], ...p, p[0], p[1]] : [p[0], ...p, p[p.length - 1]];
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)} `;
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  if (closed) d += "Z";
  return d;
}

// a single limb as a smooth curve through shoulder→elbow→hand
const limbPath = (a: [number, number], b: [number, number], c: [number, number]) => catmull([a, b, c], false);

const pt = (x: number, y: number, deg: number, len: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [x + Math.sin(r) * len, y + Math.cos(r) * len];
};

type Limb = [number, number];
const POSES: Record<Pose, { armL: Limb; armR: Limb; legL: Limb; legR: Limb; pointer?: boolean }> = {
  idle: { armL: [-14, -20], armR: [14, 20], legL: [-8, -4], legR: [8, 4] },
  "point-right": { armL: [-14, -18], armR: [74, 96], legL: [-9, -5], legR: [12, 7], pointer: true },
  "point-left": { armL: [-74, -96], armR: [14, 18], legL: [-12, -7], legR: [9, 5], pointer: true },
  "hold-right": { armL: [-14, -18], armR: [60, 90], legL: [-9, -5], legR: [9, 5], pointer: true },
  present: { armL: [-52, -78], armR: [52, 78], legL: [-11, -6], legR: [11, 6] },
  cheer: { armL: [-158, -176], armR: [158, 176], legL: [-12, -7], legR: [12, 7] },
  worried: { armL: [-120, -150], armR: [120, 150], legL: [-7, -4], legR: [7, 4] },
  shrug: { armL: [-72, -120], armR: [72, 120], legL: [-9, -5], legR: [9, 5] },
  walk: { armL: [-28, -16], armR: [28, 16], legL: [-20, -10], legR: [20, 10] },
};

export const SmoothCharacter: React.FC<{
  pose?: Pose;
  expression?: Expression;
  appear?: number;
  seed?: number;
  pointer?: boolean;
  shirt?: string;
}> = ({ pose = "idle", expression = "neutral", appear = 1, seed = 3, pointer, shirt = "#3f7f98" }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame * 0.08) * 4;
  const blink = frame % 78 > 73;

  let { armL, armR, legL, legR, pointer: posePointer } = POSES[pose];
  const showPointer = pointer ?? posePointer ?? false;
  if (pose === "walk") {
    const s = Math.sin(frame * 0.38);
    legL = [-18 * s, -9 * s - 5]; legR = [18 * s, 9 * s + 5];
    armL = [16 * s - 4, 9 * s - 3]; armR = [-16 * s + 4, -9 * s + 3];
  }

  // skeleton — wider shoulders/hips so a shirt reads as a body
  const headCx = 180, headCy = 150, headRx = 112, headRy = 126;
  const shY = 330, shL: [number, number] = [150, shY], shR: [number, number] = [210, shY];
  const hipL: [number, number] = [162, 452], hipR: [number, number] = [198, 452];
  const eL = pt(shL[0], shL[1], armL[0], 70), hL = pt(eL[0], eL[1], armL[1], 76);
  const eR = pt(shR[0], shR[1], armR[0], 70), hR = pt(eR[0], eR[1], armR[1], 76);
  const kL = pt(hipL[0], hipL[1], legL[0], 94), fL = pt(kL[0], kL[1], legL[1], 92);
  const kR = pt(hipR[0], hipR[1], legR[0], 94), fR = pt(kR[0], kR[1], legR[1], 92);

  const line = (d: string, w = 7, color = INK) => (
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );

  // face geometry
  const eyeY = headCy + 18, eyeDx = 40;
  const mouthY = headCy + 70;

  const PANTS = "#2f3b47";
  return (
    <g transform={`translate(0 ${bob})`} opacity={appear}>
      {/* legs (pants) */}
      {line(limbPath(hipL, kL, fL), 11, PANTS)}
      {line(limbPath(hipR, kR, fR), 11, PANTS)}
      {/* shoes */}
      {line(`M ${fL[0] - 6} ${fL[1] + 2} q 20 14 34 -3`, 14)}
      {line(`M ${fR[0] - 6} ${fR[1] + 2} q 20 14 34 -3`, 14)}

      {/* arms (skin) */}
      {line(limbPath([shL[0] + 8, shL[1] + 14], eL, hL), 7)}
      {line(limbPath([shR[0] - 8, shR[1] + 14], eR, hR), 7)}
      {/* pointer stick in the right hand */}
      {showPointer && line(`M ${hR[0]} ${hR[1]} L ${hR[0] + 160} ${hR[1] - 36}`, 5, "#7a5a3a")}
      {/* hands */}
      <circle cx={hL[0]} cy={hL[1]} r={13} fill={SKIN} stroke={INK} strokeWidth={4} />
      <circle cx={hR[0]} cy={hR[1]} r={13} fill={SKIN} stroke={INK} strokeWidth={4} />

      {/* neck */}
      {line(`M 180 ${headCy + headRy - 24} L 180 ${shY - 6}`, 10, SKIN)}
      {line(`M 170 ${headCy + headRy - 16} L 170 ${shY - 2}`, 3)}
      {line(`M 190 ${headCy + headRy - 16} L 190 ${shY - 2}`, 3)}

      {/* shirt body */}
      <path
        d={`M ${shL[0]} ${shY} C ${shL[0] - 10} ${shY + 50}, ${hipL[0] - 6} ${hipL[1] - 30}, ${hipL[0]} ${hipL[1]} L ${hipR[0]} ${hipR[1]} C ${hipR[0] + 6} ${hipL[1] - 30}, ${shR[0] + 10} ${shY + 50}, ${shR[0]} ${shY} C ${headCx + 26} ${shY + 10}, ${headCx - 26} ${shY + 10}, ${shL[0]} ${shY} Z`}
        fill={shirt}
        stroke={INK}
        strokeWidth={7}
        strokeLinejoin="round"
      />
      {/* sleeves */}
      <path d={`M ${shL[0] + 2} ${shY - 2} q -26 8 -22 40 q 20 10 36 -2 Z`} fill={shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${shR[0] - 2} ${shY - 2} q 26 8 22 40 q -20 10 -36 -2 Z`} fill={shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />

      {/* head */}
      <path d={blob(headCx, headCy, headRx, headRy, seed, 0.045)} fill={SKIN} stroke={INK} strokeWidth={7} strokeLinejoin="round" />

      {/* hair — soft overlapping clumps */}
      <path d={blob(headCx, headCy - headRy + 40, headRx * 0.98, 60, seed + 7, 0.22, 16)} fill={HAIR} stroke={HAIR} strokeWidth={3} strokeLinejoin="round" />
      {[-78, -40, 0, 40, 78].map((dx, i) => (
        <path key={i} d={`M ${headCx + dx - 18} ${headCy - headRy + 52} q 18 -${30 + (i % 2) * 12} 38 0`} fill={HAIR} stroke={HAIR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* nose */}
      {line(`M ${headCx - 2} ${eyeY + 14} q -8 16 6 20`, 4)}

      {/* eyes */}
      {blink ? (
        <>
          {line(`M ${headCx - eyeDx - 12} ${eyeY} q 12 8 24 0`, 5)}
          {line(`M ${headCx + eyeDx - 12} ${eyeY} q 12 8 24 0`, 5)}
        </>
      ) : (
        <>
          <ellipse cx={headCx - eyeDx} cy={eyeY} rx={expression === "shocked" ? 13 : 9} ry={expression === "shocked" ? 17 : 12} fill={INK} />
          <ellipse cx={headCx + eyeDx} cy={eyeY} rx={expression === "shocked" ? 13 : 9} ry={expression === "shocked" ? 17 : 12} fill={INK} />
        </>
      )}

      {/* eyebrows (shown for worried / sad / shocked) */}
      {(expression === "worried" || expression === "sad") && (
        <>
          {line(`M ${headCx - eyeDx - 18} ${eyeY - 34} q 18 -6 34 4`, 5)}
          {line(`M ${headCx + eyeDx - 16} ${eyeY - 30} q 16 -10 34 -4`, 5)}
        </>
      )}
      {expression === "shocked" && (
        <>
          {line(`M ${headCx - eyeDx - 16} ${eyeY - 40} q 16 -6 32 0`, 5)}
          {line(`M ${headCx + eyeDx - 16} ${eyeY - 40} q 16 -6 32 0`, 5)}
        </>
      )}

      {/* mouth */}
      {expression === "happy" && line(`M ${headCx - 40} ${mouthY - 8} Q ${headCx} ${mouthY + 42} ${headCx + 40} ${mouthY - 8}`, 6)}
      {expression === "neutral" && line(`M ${headCx - 34} ${mouthY + 6} Q ${headCx} ${mouthY + 20} ${headCx + 34} ${mouthY + 6}`, 6)}
      {expression === "worried" && line(`M ${headCx - 26} ${mouthY + 10} Q ${headCx} ${mouthY - 2} ${headCx + 26} ${mouthY + 10}`, 6)}
      {expression === "sad" && line(`M ${headCx - 30} ${mouthY + 16} Q ${headCx} ${mouthY - 12} ${headCx + 30} ${mouthY + 16}`, 6)}
      {expression === "shocked" && <ellipse cx={headCx} cy={mouthY + 10} rx={20} ry={26} fill="#7a2f2a" stroke={INK} strokeWidth={5} />}
    </g>
  );
};
