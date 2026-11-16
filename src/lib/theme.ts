import { loadFont as loadShantell } from "@remotion/google-fonts/ShantellSans";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadPatrick } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const marker = loadShantell().fontFamily; // headlines (bold marker)
export const hand = loadCaveat().fontFamily; // big hand-written numbers / notes
export const print = loadPatrick().fontFamily; // captions / labels (neat handwriting)
export const inter = loadInter().fontFamily; // tiny source/meta text

// kept for back-compat with older components
export const anton = marker;
export const archivo = marker;

/**
 * Palette distilled from Casual Finance: a white page, confident black ink, pale
 * peach skin, and a few MUTED, MEANINGFUL accents — green for money/relief, red
 * for loss/danger, yellow for the highlighter. No loud brand orange.
 */
export const palette = {
  paper: "#ffffff",
  ink: "#141414",
  inkSoft: "#5b5b5b",
  skin: "#fcd5b5",
  green: "#2f9e60", // money / good / relief
  greenDeep: "#1f7a49",
  red: "#d1483a", // loss / danger (muted, not neon)
  redDeep: "#a5392e",
  yellow: "#ffe15a", // highlighter
  blue: "#3f6fb0", // calm / links
  sage: "#6b8967",
  neutral: "#9a9a9a",
  highlight: "#fff1a6",
};

/** Series accents, re-tuned to the muted palette (no bright orange). */
export const SERIES_COLORS: Record<string, string> = {
  Structures: "#3f6fb0",
  "Cases by the Numbers": "#d1483a",
  "What Happens If": "#2f9e60",
  "Rules of the Rich": "#1f7a49",
};
