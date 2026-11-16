import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SmoothCharacter, Expression, Pose } from "../art/SmoothCharacter";
import { Prop, PropName } from "../art/props";
import { RoughShape } from "../lib/rough";
import { marker, hand, palette } from "../lib/theme";
import { money } from "../lib/util";
import { reveal } from "../lib/util";
import type { RenderScene } from "../schema";

const emphasisFor = (scene: RenderScene): string =>
  scene.ledgerState === "red" ? palette.red : scene.ledgerState === "gold" ? palette.green : palette.ink;

/**
 * Concept scene: the character stands on the left and points a stick at a hand-
 * drawn tool on the right, under a marker headline. The running balance is a
 * hand-written note by the tool (red when owed, green when cleared).
 */
export const PresenterStage: React.FC<{ scene: RenderScene; accent: string; prevLedger?: number }> = ({ scene, scene: s, accent, prevLedger }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const emphasis = emphasisFor(scene);

  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 110 } });
  const charX = interpolate(enter, [0, 1], [-220, 0]);
  const propPop = spring({ frame: frame - 10, fps, config: { damping: 11, stiffness: 120 } });
  const propDraw = reveal(frame, 12, 34);
  const headIn = reveal(frame, 2, 18);
  const underlineDraw = reveal(frame, 18, 42);
  const badgeIn = spring({ frame: frame - 16, fps, config: { damping: 10, stiffness: 130 } });

  const hasProp = !!scene.prop;
  const pose: Pose = (scene.pose as Pose) || (hasProp ? "point-right" : "present");
  const expression: Expression = (scene.expression as Expression) || "neutral";
  const headline = scene.headline ?? "";
  const ulW = Math.min(1500, headline.length * 40 + 120);
  // short labels become a sticky "Day 30" tab by the prop; long ones a subtitle
  const shortBadge = !!scene.subhead && scene.subhead.length <= 16 && hasProp;
  const subtitle = !!scene.subhead && !shortBadge ? scene.subhead : null;

  // balance count-up within the scene
  const balance = scene.ledger != null
    ? Math.round(interpolate(spring({ frame: frame - 14, fps, config: { damping: 18 } }), [0, 1], [prevLedger ?? scene.ledger, scene.ledger]))
    : null;

  return (
    <AbsoluteFill>
      {/* headline */}
      <div style={{ position: "absolute", top: 64, left: 0, right: 0, textAlign: "center", opacity: headIn, transform: `translateY(${(1 - headIn) * -16}px)` }}>
        <div style={{ display: "inline-block", position: "relative" }}>
          <div style={{ fontFamily: marker, fontWeight: 800, fontSize: 86, lineHeight: 1.0, color: palette.ink }}>{headline}</div>
          <svg width={ulW} height={30} style={{ position: "absolute", left: "50%", bottom: -18, transform: "translateX(-50%)", overflow: "visible" }}>
            <RoughShape shape={{ type: "line", x1: 8, y1: 14, x2: ulW - 8, y2: 14 }} seed={9} draw={underlineDraw} options={{ stroke: emphasis, strokeWidth: 9, roughness: 1.4, bowing: 1.8 }} />
          </svg>
        </div>
        {subtitle && (
          <div style={{ fontFamily: print, fontSize: 40, color: palette.inkSoft, marginTop: 26, maxWidth: 1200, marginLeft: "auto", marginRight: "auto" }}>{subtitle}</div>
        )}
      </div>

      <svg width={width} height={1080} style={{ position: "absolute", overflow: "visible" }}>
        {/* character */}
        <g transform={`translate(${140 + charX}, 326) scale(0.94)`} opacity={enter}>
          <SmoothCharacter pose={pose} expression={expression} />
        </g>

        {/* prop */}
        {hasProp && (
          <g transform={`translate(1290, 540) scale(${2.25 * Math.max(0.001, propPop)})`}>
            <g transform="translate(-130,-115)">
              <Prop name={scene.prop as PropName} draw={propDraw} accent={emphasis} value={scene.propValue} day={scene.propDay} stamp={scene.stamp} />
            </g>
          </g>
        )}
      </svg>

      {/* day badge — a marker sticky tab (short labels only) */}
      {shortBadge && (
        <div style={{ position: "absolute", top: 320, left: 980, opacity: badgeIn, transform: `scale(${badgeIn}) rotate(-3deg)` }}>
          <span style={{ display: "inline-block", background: palette.yellow, color: palette.ink, fontFamily: marker, fontWeight: 800, fontSize: 34, padding: "8px 22px", border: `3px solid ${palette.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 rgba(20,20,20,0.18)" }}>
            {scene.subhead}
          </span>
        </div>
      )}

      {/* hand-written balance by the prop */}
      {balance != null && (
        <div style={{ position: "absolute", top: 760, left: 1080, width: 420, textAlign: "center", opacity: propDraw, transform: "rotate(-4deg)" }}>
          <span style={{ fontFamily: hand, fontWeight: 700, fontSize: 92, color: emphasis, lineHeight: 0.9 }}>{money(balance)}</span>
          <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 40, color: palette.inkSoft, marginTop: -6 }}>
            {scene.ledgerState === "gold" ? "cleared" : "owed"}
          </div>
        </div>
      )}

      {/* citation */}
      {scene.citation && (
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontFamily: marker, fontWeight: 700, fontSize: 26, color: palette.inkSoft, borderBottom: `3px solid ${emphasis}`, paddingBottom: 2 }}>§ {scene.citation}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
