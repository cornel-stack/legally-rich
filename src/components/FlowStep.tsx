import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal, bob } from "../lib/util";

const stateColor: Record<string, string> = {
  neutral: palette.ink,
  gold: palette.gold,
  red: palette.red,
};

/**
 * One flowchart step: a hand-drawn box draws itself on, the day-marker and label
 * fade in, the statute citation prints beneath, and an arrow points in from the
 * step before. The box border carries the money-at-risk colour.
 */
export const FlowStep: React.FC<{
  headline: string;
  subhead?: string;
  citation?: string;
  ledgerState?: "neutral" | "gold" | "red";
  accent: string;
  chapter?: number;
}> = ({ headline, subhead, citation, ledgerState = "neutral", accent, chapter }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const boxW = 1180;
  const boxH = 380;
  const cx = width / 2;
  const cy = height / 2 - 30;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  const boxDraw = reveal(frame, 4, 30);
  const arrowDraw = reveal(frame, 0, 16);
  const labelIn = reveal(frame, 20, 36);
  const subIn = reveal(frame, 10, 24);
  const citeIn = reveal(frame, 40, 56);
  const border = stateColor[ledgerState];

  const floatY = bob(frame, 3, 0.06);

  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{ position: "absolute", overflow: "visible" }}>
        {/* arrow coming in from the left */}
        <g transform={`translate(0, ${floatY})`}>
          <RoughShape
            shape={{ type: "line", x1: bx - 190, y1: cy, x2: bx - 18, y2: cy }}
            seed={5}
            draw={arrowDraw}
            boil={6}
            options={{ stroke: palette.inkSoft, strokeWidth: 7, roughness: 1.8 }}
          />
          <RoughShape
            shape={{ type: "linearPath", points: [[bx - 60, cy - 26], [bx - 18, cy], [bx - 60, cy + 26]] }}
            seed={6}
            draw={arrowDraw}
            options={{ stroke: palette.inkSoft, strokeWidth: 7, roughness: 1.5 }}
          />

          {/* the step box */}
          <RoughShape
            shape={{ type: "rect", x: bx, y: by, w: boxW, h: boxH }}
            seed={21}
            draw={boxDraw}
            boil={5}
            options={{
              stroke: border,
              strokeWidth: 9,
              roughness: 2.1,
              bowing: 1.2,
              fill: ledgerState === "red" ? "rgba(220,38,38,0.07)" : "rgba(234,179,8,0.06)",
              fillStyle: "solid",
            }}
          />
        </g>
      </svg>

      {/* day / marker */}
      {subhead && (
        <div
          style={{
            position: "absolute",
            top: by + floatY - 74,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: subIn,
            fontFamily: inter,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 40,
            color: accent,
          }}
        >
          {subhead}
        </div>
      )}

      {/* step label */}
      <div
        style={{
          position: "absolute",
          top: by + floatY,
          left: bx,
          width: boxW,
          height: boxH,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 70px",
          opacity: labelIn,
          transform: `scale(${0.96 + labelIn * 0.04})`,
        }}
      >
        <span
          style={{
            fontFamily: anton,
            fontSize: 78,
            lineHeight: 1.04,
            textAlign: "center",
            color: palette.ink,
          }}
        >
          {headline}
        </span>
      </div>

      {/* citation beneath the box */}
      {citation && (
        <div
          style={{
            position: "absolute",
            top: by + boxH + floatY + 36,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: citeIn,
          }}
        >
          <span
            style={{
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 30,
              color: palette.inkSoft,
              borderBottom: `3px solid ${accent}`,
              paddingBottom: 4,
            }}
          >
            § {citation}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
