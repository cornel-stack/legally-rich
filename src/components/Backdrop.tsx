import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "../lib/theme";

/** Warm paper background with a faint grid, like a legal-pad / case-file feel. */
export const Backdrop: React.FC<{ accent: string }> = ({ accent }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.06 }}>
        <defs>
          <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke={palette.ink} strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* thin accent spine down the left margin, like a folder edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 14,
          backgroundColor: accent,
          opacity: 0.9,
        }}
      />
      {/* subtle vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 320px rgba(23,18,13,0.18)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
