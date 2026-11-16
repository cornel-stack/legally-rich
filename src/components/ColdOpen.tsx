import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../art/Character";
import { Prop, PropName } from "../art/props";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal } from "../lib/util";

/**
 * The hook. The card draws itself on, a red X is slashed across it, "STOP PAYING?"
 * punches in, the character recoils — then a row of consequence icons pops in as a
 * teaser for the whole video.
 */
export const ColdOpen: React.FC<{ headline: string; subhead?: string; accent: string; kicker?: string }> = ({ headline, subhead, accent, kicker }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const cardDraw = reveal(frame, 10, 34);
  const cardPop = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 120 } });

  // red X slashes across the card
  const slash1 = reveal(frame, 46, 60);
  const slash2 = reveal(frame, 58, 72);
  const slashed = frame > 50;

  const kickerIn = reveal(frame, 4, 18);
  const stopPop = spring({ frame: frame - 70, fps, config: { damping: 9, mass: 0.7, stiffness: 130 } });
  const shake = frame > 70 && frame < 86 ? Math.sin(frame * 3) * (86 - frame) * 0.9 : 0;

  // teaser icons pop in one by one after ~3.2s
  const teasers: PropName[] = ["gavel", "bank", "hourglass", "prison"];

  const cardCx = width / 2 + 60;
  const cardCy = 470;

  return (
    <AbsoluteFill>
      {/* floating $ and % doodles for life */}
      {["$", "%", "$", "%", "$"].map((s, i) => {
        const x = 160 + i * 360;
        const y = 180 + Math.sin(frame * 0.05 + i) * 16 + (i % 2) * 60;
        return <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: anton, fontSize: 70, color: "#efe7da" }}>{s}</div>;
      })}

      {/* kicker */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: kickerIn }}>
        <span style={{ fontFamily: inter, fontWeight: 800, letterSpacing: 6, textTransform: "uppercase", fontSize: 40, color: palette.inkSoft }}>
          {kicker || "What if you just…"}
        </span>
      </div>

      {/* STOP PAYING? */}
      <div style={{ position: "absolute", top: 180, left: 0, right: 0, textAlign: "center", transform: `scale(${stopPop}) translateX(${shake}px)`, transformOrigin: "center" }}>
        <span style={{ fontFamily: anton, fontSize: 150, color: palette.red, textShadow: "5px 6px 0 rgba(0,0,0,0.12)" }}>{headline || "STOP PAYING?"}</span>
      </div>

      <svg width={width} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        {/* character bottom-left, recoils once slashed */}
        <g transform={`translate(${120 + (1 - enter) * -200}, 360) scale(0.86)`} opacity={enter}>
          <Character pose={slashed ? "worried" : "present"} expression={slashed ? "shocked" : "happy"} shirt="#3b82f6" />
        </g>

        {/* the credit card (inner g centres the box on the origin) */}
        <g transform={`translate(${cardCx}, ${cardCy}) scale(${1.7 * (0.6 + 0.4 * Math.max(0.001, cardPop))})`}>
          <g transform="translate(-130,-100)">
            <Prop name="credit-card" draw={cardDraw} accent={accent} />
            <text x={130} y={215} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={54} fill={palette.ink} opacity={reveal(frame, 34, 46)}>$3,000</text>
          </g>
        </g>

        {/* red X */}
        <g transform={`translate(${cardCx}, ${cardCy})`}>
          <RoughShape shape={{ type: "line", x1: -170, y1: -120, x2: 170, y2: 120 }} seed={3} draw={slash1} options={{ stroke: palette.red, strokeWidth: 16, roughness: 1.8 }} />
          <RoughShape shape={{ type: "line", x1: 170, y1: -120, x2: -170, y2: 120 }} seed={4} draw={slash2} options={{ stroke: palette.red, strokeWidth: 16, roughness: 1.8 }} />
        </g>
      </svg>

      {/* teaser consequence icons */}
      <svg width={width} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        {teasers.map((t, i) => {
          const pop = spring({ frame: frame - (96 + i * 10), fps, config: { damping: 11, stiffness: 130 } });
          const x = width / 2 - 560 + i * 380;
          return (
            <g key={t} transform={`translate(${x}, 820) scale(${1.15 * pop})`} opacity={pop}>
              <g transform="translate(-130,-115)">
                <Prop name={t} draw={pop} accent={i % 2 ? palette.red : accent} />
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
