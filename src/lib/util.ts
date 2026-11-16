import { interpolate } from "remotion";

export const money = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Ease-out reveal 0..1 over [start,end] frames. */
export const reveal = (frame: number, start: number, end: number): number =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

/** A gentle, deterministic bob for "alive" elements (no randomness). */
export const bob = (frame: number, amp = 4, speed = 0.12, phase = 0): number =>
  Math.sin(frame * speed + phase) * amp;

export const secToFrames = (s: number, fps: number): number => Math.round(s * fps);
