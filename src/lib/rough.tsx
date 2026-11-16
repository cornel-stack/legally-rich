/**
 * Rough.js helpers for Remotion.
 *
 * Uses the rough *generator* (not the DOM renderer) so every shape is a pure,
 * deterministic set of SVG <path>s — no refs, no effects, safe for frame-by-frame
 * CI rendering.
 *
 * Two touches make the drawings feel hand-made:
 *   - `draw`  (0..1): strokes draw themselves on, via the SVG pathLength trick.
 *   - `boil`  (frames): the rough seed steps every N frames, so the lines wiggle
 *                       like real hand-drawn animation ("boiling line").
 */
import React, { useMemo } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import { useCurrentFrame } from "remotion";

const generator = rough.generator();

type ShapeSpec =
  | { type: "rect"; x: number; y: number; w: number; h: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "ellipse"; cx: number; cy: number; w: number; h: number }
  | { type: "circle"; cx: number; cy: number; d: number }
  | { type: "path"; d: string }
  | { type: "polygon"; points: [number, number][] }
  | { type: "linearPath"; points: [number, number][] };

export const RoughShape: React.FC<{
  shape: ShapeSpec;
  seed?: number;
  options?: Options;
  /** 0..1 stroke draw-on progress (1 = fully drawn). */
  draw?: number;
  /** reseed every N frames for a living hand-drawn wobble; 0 = static. */
  boil?: number;
  style?: React.CSSProperties;
}> = ({ shape, seed = 1, options = {}, draw = 1, boil = 0, style }) => {
  const frame = useCurrentFrame();
  const boilStep = boil > 0 ? Math.floor(frame / boil) : 0;
  const effectiveSeed = seed + boilStep;

  const paths = useMemo(() => {
    const opts: Options = { seed: effectiveSeed, ...options };
    let drawable;
    switch (shape.type) {
      case "rect":
        drawable = generator.rectangle(shape.x, shape.y, shape.w, shape.h, opts);
        break;
      case "line":
        drawable = generator.line(shape.x1, shape.y1, shape.x2, shape.y2, opts);
        break;
      case "ellipse":
        drawable = generator.ellipse(shape.cx, shape.cy, shape.w, shape.h, opts);
        break;
      case "circle":
        drawable = generator.circle(shape.cx, shape.cy, shape.d, opts);
        break;
      case "path":
        drawable = generator.path(shape.d, opts);
        break;
      case "polygon":
        drawable = generator.polygon(shape.points, opts);
        break;
      case "linearPath":
        drawable = generator.linearPath(shape.points, opts);
        break;
    }
    return generator.toPaths(drawable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSeed, JSON.stringify(shape), JSON.stringify(options)]);

  return (
    <g style={style}>
      {paths.map((p, i) => {
        const isFill = p.fill && p.fill !== "none";
        // Only animate the outline strokes on; fills snap in with the draw.
        const dash =
          !isFill && draw < 1
            ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw }
            : {};
        return (
          <path
            key={i}
            d={p.d}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isFill ? draw : 1}
            {...dash}
          />
        );
      })}
    </g>
  );
};
