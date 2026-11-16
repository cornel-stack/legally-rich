import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal } from "../lib/util";

/**
 * The cold open. The stakes land as a number before the character speaks.
 * A hand-drawn ring scribbles around it; the figure punches in and settles.
 */
export const ColdOpen: React.FC<{
  headline: string;
  subhead?: string;
  accent: string;
  kicker?: string;
}> = ({ headline, subhead, accent, kicker }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const punch = spring({ frame, fps, config: { damping: 9, mass: 0.7, stiffness: 120 } });
  const scale = interpolate(punch, [0, 1], [1.6, 1]);
  const settle = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  // impact shake on the first few frames
  const shake = frame < 10 ? Math.sin(frame * 3) * (10 - frame) * 1.1 : 0;

  // hand-drawn ring draws on after the number lands
  const ringDraw = reveal(frame, 14, 40);
  const kickerIn = reveal(frame, 2, 14);
  const subIn = reveal(frame, 44, 60);

  const ringW = Math.min(1500, headline.length * 72 + 220);
  const ringH = 260;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `translate(${shake}px, 0)`, textAlign: "center", position: "relative" }}>
        {kicker && (
          <div
            style={{
              opacity: kickerIn,
              transform: `translateY(${(1 - kickerIn) * -20}px)`,
              fontFamily: inter,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
              fontSize: 34,
              color: accent,
              marginBottom: 18,
            }}
          >
            {kicker}
          </div>
        )}

        <div style={{ position: "relative", display: "inline-block", padding: "0 60px" }}>
          <div
            style={{
              opacity: settle,
              transform: `scale(${scale})`,
              fontFamily: anton,
              fontSize: 190,
              lineHeight: 0.98,
              color: palette.ink,
              textShadow: "4px 5px 0 rgba(0,0,0,0.08)",
            }}
          >
            {headline}
          </div>

          {/* hand-drawn ring around the number */}
          <svg
            width={ringW}
            height={ringH}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <RoughShape
              shape={{ type: "ellipse", cx: ringW / 2, cy: ringH / 2, w: ringW - 20, h: ringH - 20 }}
              seed={11}
              draw={ringDraw}
              boil={5}
              options={{ stroke: accent, strokeWidth: 8, roughness: 2.4, bowing: 1.5 }}
            />
          </svg>
        </div>

        {subhead && (
          <div
            style={{
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 20}px)`,
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 46,
              color: palette.inkSoft,
              marginTop: 60,
              maxWidth: width * 0.7,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {subhead}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
