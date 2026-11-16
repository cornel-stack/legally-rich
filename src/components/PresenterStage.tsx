import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, Expression, Pose } from "../art/Character";
import { Prop, PropName } from "../art/props";
import { RoughShape } from "../lib/rough";
import { anton, inter, palette } from "../lib/theme";
import { reveal } from "../lib/util";
import type { RenderScene } from "../schema";

/**
 * A presenter scene: the doodle character walks in on the left and points at a
 * hand-drawn tool on the right, under a bold headline with a day badge. The prop
 * draws itself on; the character reacts with the directed expression.
 */
export const PresenterStage: React.FC<{ scene: RenderScene; accent: string }> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.8, stiffness: 110 } });
  const charX = interpolate(enter, [0, 1], [-260, 0]);

  const propPop = spring({ frame: frame - 10, fps, config: { damping: 11, mass: 0.7, stiffness: 120 } });
  const propDraw = reveal(frame, 12, 34);
  const headIn = reveal(frame, 2, 18);
  const badgeIn = reveal(frame, 16, 30);
  const underlineDraw = reveal(frame, 20, 44);

  const hasProp = !!scene.prop;
  // point at the prop once it is up; otherwise greet
  const pose: Pose = (scene.pose as Pose) || (hasProp ? "point-right" : "present");
  const expression: Expression = (scene.expression as Expression) || "neutral";

  const headline = scene.headline ?? "";
  const ulW = Math.min(1500, headline.length * 42 + 120);

  return (
    <AbsoluteFill>
      {/* headline */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", opacity: headIn, transform: `translateY(${(1 - headIn) * -18}px)` }}>
        <div style={{ display: "inline-block", position: "relative" }}>
          <div style={{ fontFamily: anton, fontSize: 92, lineHeight: 1.02, color: palette.ink, letterSpacing: 0.5 }}>{headline}</div>
          <svg width={ulW} height={34} style={{ position: "absolute", left: "50%", bottom: -22, transform: "translateX(-50%)", overflow: "visible" }}>
            <RoughShape shape={{ type: "line", x1: 8, y1: 16, x2: ulW - 8, y2: 16 }} seed={9} draw={underlineDraw} boil={6} options={{ stroke: accent, strokeWidth: 10, roughness: 2.2, bowing: 2.5 }} />
          </svg>
        </div>
      </div>

      <svg width={width} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        {/* character, lower-left */}
        <g transform={`translate(${110 + charX}, 316) scale(0.92)`} opacity={enter}>
          <Character pose={pose} expression={expression} shirt="#3b82f6" />
        </g>

        {/* prop, centre-right (inner g centres the 260x230 box on the origin) */}
        {hasProp && (
          <g transform={`translate(1270, 520) scale(${2.3 * Math.max(0.001, propPop)})`}>
            <g transform="translate(-130,-115)">
              <Prop name={scene.prop as PropName} draw={propDraw} accent={accent} value={scene.propValue} day={scene.propDay} stamp={scene.stamp} />
            </g>
          </g>
        )}
      </svg>

      {/* day badge above the prop */}
      {scene.subhead && (
        <div style={{ position: "absolute", top: 360, left: 0, right: 0, textAlign: "center", opacity: badgeIn, transform: `scale(${0.8 + badgeIn * 0.2})` }}>
          <span style={{ display: "inline-block", marginLeft: 360, background: accent, color: "#fff", fontFamily: inter, fontWeight: 900, fontSize: 36, letterSpacing: 2, textTransform: "uppercase", padding: "10px 26px", borderRadius: 40, boxShadow: "0 6px 0 rgba(0,0,0,0.12)" }}>
            {scene.subhead}
          </span>
        </div>
      )}

      {/* citation under the prop */}
      {scene.citation && (
        <div style={{ position: "absolute", top: 860, left: 360, right: 0, textAlign: "center", opacity: propDraw }}>
          <span style={{ fontFamily: inter, fontWeight: 700, fontSize: 28, color: palette.inkSoft, borderBottom: `3px solid ${accent}`, paddingBottom: 3 }}>§ {scene.citation}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
