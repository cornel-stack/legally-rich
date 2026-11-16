import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal } from "../lib/util";

/** A centred text card for chapter breaks, jurisdiction notes and the outro. */
export const TextCard: React.FC<{
  kicker?: string;
  headline: string;
  subhead?: string;
  accent: string;
  underline?: boolean;
  disclaimer?: boolean;
}> = ({ kicker, headline, subhead, accent, underline = true, disclaimer = false }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const kickerIn = reveal(frame, 2, 14);
  const headIn = reveal(frame, 8, 24);
  const underlineDraw = reveal(frame, 22, 46);
  const subIn = reveal(frame, 30, 48);

  const ulW = Math.min(1300, headline.length * 44 + 120);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 160px" }}>
      <div style={{ textAlign: "center", maxWidth: width * 0.78 }}>
        {kicker && (
          <div
            style={{
              opacity: kickerIn,
              fontFamily: inter,
              fontWeight: 800,
              letterSpacing: 5,
              textTransform: "uppercase",
              fontSize: 32,
              color: accent,
              marginBottom: 22,
            }}
          >
            {kicker}
          </div>
        )}
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 24}px)`,
              fontFamily: anton,
              fontSize: 112,
              lineHeight: 1.05,
              color: palette.ink,
            }}
          >
            {headline}
          </div>
          {underline && (
            <svg width={ulW} height={44} style={{ position: "absolute", left: "50%", bottom: -30, transform: "translateX(-50%)", overflow: "visible" }}>
              <RoughShape
                shape={{ type: "line", x1: 10, y1: 22, x2: ulW - 10, y2: 22 }}
                seed={9}
                draw={underlineDraw}
                boil={6}
                options={{ stroke: accent, strokeWidth: 10, roughness: 2.2, bowing: 2.5 }}
              />
            </svg>
          )}
        </div>
        {subhead && (
          <div
            style={{
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 18}px)`,
              fontFamily: inter,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1.4,
              color: palette.inkSoft,
              marginTop: 70,
            }}
          >
            {subhead}
          </div>
        )}
        {disclaimer && (
          <div
            style={{
              opacity: subIn,
              marginTop: 60,
              display: "inline-block",
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 26,
              color: palette.inkSoft,
              border: `3px dashed ${palette.neutral}`,
              borderRadius: 12,
              padding: "14px 28px",
            }}
          >
            This video is educational and not legal or financial advice.
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
