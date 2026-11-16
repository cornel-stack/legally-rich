import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadArchivo } from "@remotion/google-fonts/ArchivoBlack";

export const anton = loadAnton().fontFamily; // display / headlines
export const inter = loadInter().fontFamily; // body / small print
export const archivo = loadArchivo().fontFamily; // heavy captions

/** Series accent colours (from the channel plan). */
export const SERIES_COLORS: Record<string, string> = {
  Structures: "#2563eb",
  "Cases by the Numbers": "#dc2626",
  "What Happens If": "#ea580c",
  "Rules of the Rich": "#16a34a",
};

export const palette = {
  paper: "#f6f1e7", // warm off-white
  ink: "#17120d", // near-black
  inkSoft: "#4b4036",
  gold: "#eab308", // money in
  red: "#dc2626", // at risk
  neutral: "#8a7f70",
  highlight: "#fff2a8",
  highlightStroke: "#e4b100",
};
