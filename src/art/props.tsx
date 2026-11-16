import React from "react";
import { useCurrentFrame } from "remotion";
import { RoughShape } from "../lib/rough";
import { palette } from "../lib/theme";

/**
 * Hand-drawn tools/props, each drawn with Rough.js in a local ~260x200 box
 * (origin top-left). Returns a <g>, so a scene places it inside its own <svg>
 * via <g transform="translate(x,y) scale(s)">. `draw` (0..1) animates the strokes
 * on; `accent` tints the hero element.
 */
const INK = "#1d1d1d";

export type PropName =
  | "credit-card"
  | "calendar"
  | "gauge"
  | "document"
  | "bank"
  | "gavel"
  | "house"
  | "prison"
  | "magnifier"
  | "shield"
  | "hourglass"
  | "money"
  | "scales";

const ink = (w = 5, roughness = 0.8) => ({ stroke: INK, strokeWidth: w, roughness, bowing: 1 });

const CreditCard: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <RoughShape shape={{ type: "rect", x: 6, y: 20, w: 248, h: 160 }} seed={2} draw={draw} boil={7} options={{ ...ink(6), fill: accent, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 6, y: 46, w: 248, h: 30 }} seed={3} draw={draw} options={{ ...ink(2), fill: INK, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 30, y: 100, w: 46, h: 36 }} seed={4} draw={draw} options={{ ...ink(3), fill: "#f2d06b", fillStyle: "solid" }} />
    <RoughShape shape={{ type: "line", x1: 110, y1: 150, x2: 230, y2: 150 }} seed={5} draw={draw} options={ink(4)} />
    <RoughShape shape={{ type: "line", x1: 110, y1: 165, x2: 190, y2: 165 }} seed={6} draw={draw} options={ink(3)} />
  </g>
);

const Calendar: React.FC<{ draw: number; accent: string; day?: string }> = ({ draw, accent, day }) => (
  <g>
    <RoughShape shape={{ type: "rect", x: 20, y: 30, w: 220, h: 170 }} seed={2} draw={draw} boil={8} options={{ ...ink(6), fill: "#fff", fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 20, y: 30, w: 220, h: 44 }} seed={3} draw={draw} options={{ ...ink(4), fill: accent, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "line", x1: 70, y1: 16, x2: 70, y2: 48 }} seed={4} draw={draw} options={ink(6)} />
    <RoughShape shape={{ type: "line", x1: 190, y1: 16, x2: 190, y2: 48 }} seed={5} draw={draw} options={ink(6)} />
    {day ? (
      <text x={130} y={160} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={78} fill={INK}>{day}</text>
    ) : (
      [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
        <RoughShape key={`${r}-${c}`} shape={{ type: "rect", x: 44 + c * 42, y: 92 + r * 32, w: 24, h: 18 }} seed={10 + r * 4 + c} draw={draw} options={ink(2, 1)} />
      )))
    )}
  </g>
);

const Gauge: React.FC<{ draw: number; accent: string; value?: number }> = ({ draw, accent, value = 0.8 }) => {
  // semicircle from 180deg to 0deg; needle at value (0..1)
  const cx = 130, cy = 160, r = 110;
  const ang = Math.PI - value * Math.PI;
  const nx = cx + Math.cos(ang) * (r - 24);
  const ny = cy - Math.sin(ang) * (r - 24);
  return (
    <g>
      <RoughShape shape={{ type: "path", d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}` }} seed={2} draw={draw} boil={7} options={ink(8)} />
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const a = Math.PI - t * Math.PI;
        const x1 = cx + Math.cos(a) * r, y1 = cy - Math.sin(a) * r;
        const x2 = cx + Math.cos(a) * (r - 18), y2 = cy - Math.sin(a) * (r - 18);
        return <RoughShape key={i} shape={{ type: "line", x1, y1, x2, y2 }} seed={20 + i} draw={draw} options={{ ...ink(4), stroke: t > 0.6 ? palette.red : INK }} />;
      })}
      <RoughShape shape={{ type: "line", x1: cx, y1: cy, x2: nx, y2: ny }} seed={9} options={{ ...ink(7), stroke: accent }} />
      <RoughShape shape={{ type: "circle", cx, cy, d: 20 }} seed={10} options={{ ...ink(4), fill: INK, fillStyle: "solid" }} />
    </g>
  );
};

const Document: React.FC<{ draw: number; accent: string; stamp?: boolean }> = ({ draw, accent, stamp }) => (
  <g>
    <RoughShape shape={{ type: "linearPath", points: [[40, 20], [200, 20], [230, 50], [230, 210], [40, 210], [40, 20]] }} seed={2} draw={draw} boil={8} options={{ ...ink(6), fill: "#fff", fillStyle: "solid" }} />
    <RoughShape shape={{ type: "linearPath", points: [[200, 20], [200, 50], [230, 50]] }} seed={3} draw={draw} options={ink(4)} />
    <RoughShape shape={{ type: "rect", x: 60, y: 54, w: 90, h: 16 }} seed={4} draw={draw} options={{ ...ink(2), fill: accent, fillStyle: "solid" }} />
    {[0, 1, 2, 3, 4].map((i) => (
      <RoughShape key={i} shape={{ type: "line", x1: 60, y1: 100 + i * 22, x2: 210, y2: 100 + i * 22 }} seed={10 + i} draw={draw} options={ink(3, 1)} />
    ))}
    {stamp && <RoughShape shape={{ type: "circle", cx: 165, cy: 165, d: 92 }} seed={30} draw={draw} options={{ ...ink(5), stroke: palette.red }} />}
  </g>
);

const Bank: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <RoughShape shape={{ type: "linearPath", points: [[20, 80], [135, 24], [250, 80]] }} seed={2} draw={draw} options={{ ...ink(7), fill: accent, fillStyle: "solid" }} />
    {[0, 1, 2, 3].map((i) => (
      <RoughShape key={i} shape={{ type: "rect", x: 40 + i * 56, y: 92, w: 22, h: 96 }} seed={10 + i} draw={draw} boil={8} options={ink(6)} />
    ))}
    <RoughShape shape={{ type: "rect", x: 16, y: 188, w: 238, h: 22 }} seed={20} draw={draw} options={{ ...ink(6), fill: accent, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "line", x1: 20, y1: 86, x2: 250, y2: 86 }} seed={21} draw={draw} options={ink(6)} />
  </g>
);

const Gavel: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <g style={{ transform: "rotate(-20deg)", transformOrigin: "140px 90px" }}>
      <RoughShape shape={{ type: "rect", x: 96, y: 54, w: 90, h: 56 }} seed={2} draw={draw} boil={7} options={{ ...ink(6), fill: accent, fillStyle: "solid" }} />
      <RoughShape shape={{ type: "line", x1: 110, y1: 54, x2: 110, y2: 110 }} seed={3} draw={draw} options={ink(5)} />
      <RoughShape shape={{ type: "line", x1: 172, y1: 54, x2: 172, y2: 110 }} seed={4} draw={draw} options={ink(5)} />
      <RoughShape shape={{ type: "line", x1: 140, y1: 108, x2: 60, y2: 190 }} seed={5} draw={draw} options={ink(10)} />
    </g>
    <RoughShape shape={{ type: "rect", x: 120, y: 196, w: 120, h: 24 }} seed={9} draw={draw} options={{ ...ink(6), fill: "#caa46a", fillStyle: "solid" }} />
  </g>
);

const House: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <RoughShape shape={{ type: "linearPath", points: [[30, 110], [135, 30], [240, 110]] }} seed={2} draw={draw} options={{ ...ink(7), fill: palette.red, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 56, y: 110, w: 158, h: 100 }} seed={3} draw={draw} boil={8} options={{ ...ink(6), fill: "#fff", fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 120, y: 150, w: 42, h: 60 }} seed={4} draw={draw} options={{ ...ink(5), fill: accent, fillStyle: "solid" }} />
  </g>
);

const Prison: React.FC<{ draw: number; accent: string }> = ({ draw }) => (
  <g>
    <RoughShape shape={{ type: "rect", x: 40, y: 30, w: 180, h: 180 }} seed={2} draw={draw} boil={8} options={{ ...ink(6), fill: "#fff", fillStyle: "solid" }} />
    {[0, 1, 2, 3].map((i) => (
      <RoughShape key={i} shape={{ type: "line", x1: 72 + i * 38, y1: 30, x2: 72 + i * 38, y2: 210 }} seed={10 + i} draw={draw} options={ink(6)} />
    ))}
    <RoughShape shape={{ type: "line", x1: 40, y1: 120, x2: 220, y2: 120 }} seed={20} draw={draw} options={ink(5)} />
  </g>
);

const Magnifier: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <RoughShape shape={{ type: "circle", cx: 110, cy: 100, d: 150 }} seed={2} draw={draw} boil={7} options={{ ...ink(9), stroke: accent, fill: "rgba(255,255,255,0.35)", fillStyle: "solid" }} />
    <RoughShape shape={{ type: "line", x1: 168, y1: 158, x2: 236, y2: 226 }} seed={3} draw={draw} options={ink(16)} />
  </g>
);

const Shield: React.FC<{ draw: number; accent: string }> = ({ draw }) => {
  // reliable concave fill via a plain path, with a hand-drawn outline on top
  const d = "M130 22 C 170 44, 206 50, 226 56 C 224 110, 214 170, 130 216 C 46 170, 36 110, 34 56 C 54 50, 90 44, 130 22 Z";
  return (
    <g opacity={draw}>
      <path d={d} fill="#2f9e60" stroke="#141414" strokeWidth={7} strokeLinejoin="round" />
      <path d="M84 116 L118 152 L184 74" fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

const Hourglass: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => {
  const frame = useCurrentFrame();
  const fall = (Math.sin(frame * 0.08) + 1) / 2;
  return (
    <g>
      <RoughShape shape={{ type: "line", x1: 50, y1: 26, x2: 210, y2: 26 }} seed={2} draw={draw} options={ink(8)} />
      <RoughShape shape={{ type: "line", x1: 50, y1: 214, x2: 210, y2: 214 }} seed={3} draw={draw} options={ink(8)} />
      <RoughShape shape={{ type: "linearPath", points: [[62, 30], [198, 30], [138, 120], [198, 210], [62, 210], [122, 120], [62, 30]] }} seed={4} draw={draw} boil={7} options={ink(6)} />
      <RoughShape shape={{ type: "linearPath", points: [[80, 44], [180, 44], [132, 112], [80, 44]] }} seed={5} options={{ ...ink(2), fill: accent, fillStyle: "solid", stroke: "none" as any }} style={{ opacity: 1 - fall }} />
      <RoughShape shape={{ type: "linearPath", points: [[86, 196], [174, 196], [130, 140 + fall * 20], [86, 196]] }} seed={6} options={{ ...ink(2), fill: accent, fillStyle: "solid", stroke: "none" as any }} style={{ opacity: fall }} />
    </g>
  );
};

const Money: React.FC<{ draw: number; accent: string }> = ({ draw }) => (
  <g>
    {[0, 1, 2].map((i) => (
      <RoughShape key={i} shape={{ type: "rect", x: 30 + i * 10, y: 150 - i * 26, w: 200, h: 90 }} seed={2 + i} draw={draw} boil={8} options={{ ...ink(5), fill: "#7bbf7b", fillStyle: "solid" }} />
    ))}
    <RoughShape shape={{ type: "circle", cx: 140, cy: 108, d: 56 }} seed={9} draw={draw} options={ink(4)} />
    <text x={140} y={126} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={52} fill={INK}>$</text>
  </g>
);

const Scales: React.FC<{ draw: number; accent: string }> = ({ draw, accent }) => (
  <g>
    <RoughShape shape={{ type: "line", x1: 130, y1: 20, x2: 130, y2: 200 }} seed={2} draw={draw} options={ink(7)} />
    <RoughShape shape={{ type: "line", x1: 40, y1: 50, x2: 220, y2: 50 }} seed={3} draw={draw} options={ink(7)} />
    <RoughShape shape={{ type: "path", d: `M 40 50 q -24 60 -8 70 q 32 10 56 0 q 16 -10 -8 -70` }} seed={4} draw={draw} options={{ ...ink(5), fill: accent, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "path", d: `M 220 50 q -24 60 -8 70 q 32 10 56 0 q 16 -10 -8 -70` }} seed={5} draw={draw} options={{ ...ink(5), fill: accent, fillStyle: "solid" }} />
    <RoughShape shape={{ type: "rect", x: 96, y: 200, w: 68, h: 18 }} seed={6} draw={draw} options={{ ...ink(6), fill: INK, fillStyle: "solid" }} />
  </g>
);

export const Prop: React.FC<{ name: PropName; draw?: number; accent?: string; value?: number; day?: string; stamp?: boolean }> = ({
  name,
  draw = 1,
  accent = palette.gold,
  value,
  day,
  stamp,
}) => {
  switch (name) {
    case "credit-card": return <CreditCard draw={draw} accent={accent} />;
    case "calendar": return <Calendar draw={draw} accent={accent} day={day} />;
    case "gauge": return <Gauge draw={draw} accent={accent} value={value} />;
    case "document": return <Document draw={draw} accent={accent} stamp={stamp} />;
    case "bank": return <Bank draw={draw} accent={accent} />;
    case "gavel": return <Gavel draw={draw} accent={accent} />;
    case "house": return <House draw={draw} accent={accent} />;
    case "prison": return <Prison draw={draw} accent={accent} />;
    case "magnifier": return <Magnifier draw={draw} accent={accent} />;
    case "shield": return <Shield draw={draw} accent={accent} />;
    case "hourglass": return <Hourglass draw={draw} accent={accent} />;
    case "money": return <Money draw={draw} accent={accent} />;
    case "scales": return <Scales draw={draw} accent={accent} />;
    default: return null;
  }
};
