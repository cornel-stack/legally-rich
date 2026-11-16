import React from "react";
import { useCurrentFrame } from "remotion";
import { RoughShape } from "../lib/rough";

/**
 * "Jake" — a hand-drawn doodle presenter in the Casual-Finance register: a big
 * expressive head on a thin stick body, drawn entirely with Rough.js so the lines
 * wobble and feel alive. Fully parametric: pose, expression, blink, idle bob and a
 * walk cycle, so scenes can direct him.
 *
 * Local coordinate box is 360 x 620 (feet at the bottom, centred on x=180). The
 * scene scales and positions him via the wrapping <g transform>.
 */
export type Pose =
  | "idle"
  | "point-right"
  | "point-left"
  | "hold-right"
  | "present"
  | "cheer"
  | "worried"
  | "shrug"
  | "walk";

export type Expression = "neutral" | "happy" | "worried" | "shocked" | "sad";

const INK = "#1d1d1d";

// convert an absolute angle (deg, 0 = straight down, + = toward screen-right) to a point
const pt = (x: number, y: number, deg: number, len: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [x + Math.sin(r) * len, y + Math.cos(r) * len];
};

type Limb = [number, number]; // [upperDeg, lowerDeg]

const POSES: Record<Pose, { armL: Limb; armR: Limb; legL: Limb; legR: Limb }> = {
  idle: { armL: [-16, -9], armR: [16, 9], legL: [-9, -5], legR: [9, 5] },
  "point-right": { armL: [-15, -8], armR: [82, 90], legL: [-9, -5], legR: [11, 7] },
  "point-left": { armL: [-82, -90], armR: [15, 8], legL: [-11, -7], legR: [9, 5] },
  "hold-right": { armL: [-15, -8], armR: [58, 86], legL: [-9, -5], legR: [9, 5] },
  present: { armL: [-58, -74], armR: [58, 74], legL: [-11, -6], legR: [11, 6] },
  cheer: { armL: [-152, -166], armR: [152, 166], legL: [-11, -6], legR: [11, 6] },
  worried: { armL: [-118, -150], armR: [118, 150], legL: [-7, -4], legR: [7, 4] },
  shrug: { armL: [-74, -128], armR: [74, 128], legL: [-9, -5], legR: [9, 5] },
  walk: { armL: [-30, -18], armR: [30, 18], legL: [-22, -12], legR: [22, 12] },
};

export const Character: React.FC<{
  pose?: Pose;
  expression?: Expression;
  /** 0..1 draw-on / pop appearance. */
  appear?: number;
  skin?: string;
  hair?: string;
  shirt?: string;
  seed?: number;
}> = ({ pose = "idle", expression = "neutral", appear = 1, skin = "#f3c9a6", hair = "#2a2a2a", shirt = "#3b82f6", seed = 7 }) => {
  const frame = useCurrentFrame();

  // ---- idle life ----
  const bob = Math.sin(frame * 0.09) * 4;
  const breathe = Math.sin(frame * 0.09) * 0.012 + 1;
  // blink roughly every ~2.4s for ~5 frames
  const blinkT = frame % 72;
  const blinking = blinkT > 66;

  // ---- walk cycle overrides legs/arms ----
  let { armL, armR, legL, legR } = POSES[pose];
  if (pose === "walk") {
    const s = Math.sin(frame * 0.4);
    legL = [-18 * s, -10 * s - 6];
    legR = [18 * s, 10 * s + 6];
    armL = [18 * s - 6, 10 * s - 4];
    armR = [-18 * s + 6, -10 * s + 4];
  }

  // ---- joints ----
  const headCx = 180;
  const headCy = 150;
  const headRx = 92;
  const headRy = 104;
  const shoulderY = 310;
  const shL: [number, number] = [164, shoulderY];
  const shR: [number, number] = [196, shoulderY];
  const hipL: [number, number] = [168, 430];
  const hipR: [number, number] = [192, 430];

  const elbowL = pt(shL[0], shL[1], armL[0], 66);
  const handL = pt(elbowL[0], elbowL[1], armL[1], 72);
  const elbowR = pt(shR[0], shR[1], armR[0], 66);
  const handR = pt(elbowR[0], elbowR[1], armR[1], 72);
  const kneeL = pt(hipL[0], hipL[1], legL[0], 92);
  const footL = pt(kneeL[0], kneeL[1], legL[1], 86);
  const kneeR = pt(hipR[0], hipR[1], legR[0], 92);
  const footR = pt(kneeR[0], kneeR[1], legR[1], 86);

  const stroke = { stroke: INK, strokeWidth: 6, roughness: 1.5, bowing: 1.2 };
  const thin = { stroke: INK, strokeWidth: 5, roughness: 1.6, bowing: 1.5 };

  // ---- face features ----
  const eyeY = headCy + 6;
  const eyeDx = 30;
  const Eye = ({ cx }: { cx: number }) =>
    blinking ? (
      <RoughShape shape={{ type: "line", x1: cx - 11, y1: eyeY, x2: cx + 11, y2: eyeY }} seed={seed + cx} options={{ stroke: INK, strokeWidth: 5, roughness: 1 }} />
    ) : (
      <RoughShape shape={{ type: "circle", cx, cy: eyeY, d: expression === "shocked" ? 24 : 16 }} seed={seed + cx} options={{ stroke: INK, strokeWidth: 3, fill: INK, fillStyle: "solid", roughness: 0.8 }} />
    );

  // eyebrows
  const browY = eyeY - 36;
  const brow = (cx: number, dir: number) => {
    let y1 = browY, y2 = browY;
    if (expression === "worried" || expression === "sad") {
      y1 = browY + 8 * dir * -1;
      y2 = browY - 8 * dir * -1;
    } // inner up for worried
    if (expression === "shocked") {
      y1 -= 8;
      y2 -= 8;
    }
    return <RoughShape shape={{ type: "line", x1: cx - 16, y1, x2: cx + 16, y2 }} seed={seed + cx + 3} options={{ stroke: INK, strokeWidth: 5, roughness: 1 }} />;
  };

  // mouth per expression
  const mouthY = headCy + 56;
  const Mouth = () => {
    if (expression === "happy")
      return <RoughShape shape={{ type: "path", d: `M ${headCx - 34} ${mouthY - 6} Q ${headCx} ${mouthY + 40} ${headCx + 34} ${mouthY - 6}` }} seed={seed + 9} options={{ stroke: INK, strokeWidth: 5, roughness: 1.1, fill: "#b4443a", fillStyle: "solid" }} />;
    if (expression === "shocked")
      return <RoughShape shape={{ type: "ellipse", cx: headCx, cy: mouthY + 8, w: 40, h: 52 }} seed={seed + 9} options={{ stroke: INK, strokeWidth: 5, roughness: 1.1, fill: "#7a2f2a", fillStyle: "solid" }} />;
    if (expression === "sad")
      return <RoughShape shape={{ type: "path", d: `M ${headCx - 30} ${mouthY + 18} Q ${headCx} ${mouthY - 14} ${headCx + 30} ${mouthY + 18}` }} seed={seed + 9} options={{ stroke: INK, strokeWidth: 5, roughness: 1.1 }} />;
    if (expression === "worried")
      return <RoughShape shape={{ type: "path", d: `M ${headCx - 24} ${mouthY + 10} Q ${headCx} ${mouthY - 2} ${headCx + 24} ${mouthY + 10}` }} seed={seed + 9} options={{ stroke: INK, strokeWidth: 5, roughness: 1.1 }} />;
    return <RoughShape shape={{ type: "line", x1: headCx - 26, y1: mouthY + 6, x2: headCx + 26, y2: mouthY + 6 }} seed={seed + 9} options={{ stroke: INK, strokeWidth: 5, roughness: 1 }} />;
  };

  const limb = (a: [number, number], b: [number, number], c: [number, number], s = thin) => (
    <RoughShape shape={{ type: "linearPath", points: [a, b, c] }} seed={seed + a[0] + a[1]} boil={6} options={s} />
  );

  return (
    <g style={{ transform: `translateY(${bob}px) scale(${breathe})`, transformOrigin: "180px 600px", opacity: appear }}>
      {/* legs */}
      {limb(hipL, kneeL, footL)}
      {limb(hipR, kneeR, footR)}
      {/* feet */}
      <RoughShape shape={{ type: "line", x1: footL[0] - 4, y1: footL[1], x2: footL[0] + 26, y2: footL[1] }} seed={seed + 21} options={{ stroke: INK, strokeWidth: 8, roughness: 1 }} />
      <RoughShape shape={{ type: "line", x1: footR[0] - 4, y1: footR[1], x2: footR[0] + 26, y2: footR[1] }} seed={seed + 22} options={{ stroke: INK, strokeWidth: 8, roughness: 1 }} />

      {/* torso / shirt */}
      <RoughShape
        shape={{ type: "linearPath", points: [shL, [hipL[0], hipL[1]], [hipR[0], hipR[1]], shR, shL] }}
        seed={seed + 2}
        boil={7}
        options={{ stroke: INK, strokeWidth: 6, roughness: 1.4, fill: shirt, fillStyle: "solid" }}
      />

      {/* arms */}
      {limb(shL, elbowL, handL, stroke)}
      {limb(shR, elbowR, handR, stroke)}
      {/* hands */}
      <RoughShape shape={{ type: "circle", cx: handL[0], cy: handL[1], d: 16 }} seed={seed + 31} options={{ stroke: INK, strokeWidth: 4, fill: skin, fillStyle: "solid", roughness: 1 }} />
      <RoughShape shape={{ type: "circle", cx: handR[0], cy: handR[1], d: 16 }} seed={seed + 32} options={{ stroke: INK, strokeWidth: 4, fill: skin, fillStyle: "solid", roughness: 1 }} />

      {/* neck */}
      <RoughShape shape={{ type: "line", x1: headCx, y1: headCy + headRy - 18, x2: headCx, y2: shoulderY }} seed={seed + 4} options={stroke} />

      {/* head */}
      <RoughShape shape={{ type: "ellipse", cx: headCx, cy: headCy, w: headRx * 2, h: headRy * 2 }} seed={seed + 1} boil={8} options={{ stroke: INK, strokeWidth: 6, roughness: 1.3, bowing: 1, fill: skin, fillStyle: "solid" }} />

      {/* hair — scribble across the top */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = headCx - 70 + i * 35;
        return <RoughShape key={i} shape={{ type: "path", d: `M ${x} ${headCy - 70} q 18 -34 34 2` }} seed={seed + 40 + i} boil={9} options={{ stroke: hair, strokeWidth: 9, roughness: 2.2, bowing: 2 }} />;
      })}

      {/* face */}
      <Eye cx={headCx - eyeDx} />
      <Eye cx={headCx + eyeDx} />
      {brow(headCx - eyeDx, 1)}
      {brow(headCx + eyeDx, -1)}
      <Mouth />
    </g>
  );
};
