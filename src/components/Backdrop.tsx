import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "../lib/theme";

/**
 * Clean white canvas, like a hand-drawn explainer whiteboard. A very faint dot
 * grid gives it a touch of texture; an optional ground line anchors the character.
 */
export const Backdrop: React.FC<{ accent: string; ground?: boolean }> = ({ accent, ground = false }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.5 }}>
        <defs>
          <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="#eceae5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      {ground && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 150,
            height: 10,
            background: accent,
            opacity: 0.9,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
