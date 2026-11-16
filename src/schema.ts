/**
 * Data model for a Legally Rich episode.
 *
 * Authoring:  episodes/<id>/case.json   (hand-written, fact-checked)
 * Generated:  episodes/<id>/render-manifest.json
 *   = case.json + per-scene audio file, measured duration, and word timings,
 *     with every visual `beat` anchored to the narration word it should fire on.
 */
import { z } from "zod";

/** A visual event inside a scene, fired when a narration word is spoken. */
export const BeatSchema = z.object({
  /** Substring of the narration that triggers this beat (resolved to a time at build). */
  anchor: z.string().optional(),
  /** Absolute seconds into the scene; overrides `anchor` when present. */
  at: z.number().optional(),
  /** What to do. Interpreted per scene kind. */
  action: z.string(),
  /** Free-form payload (label, amount, highlight id, …). */
  value: z.any().optional(),
});
export type Beat = z.infer<typeof BeatSchema>;

/** A highlight region on an evidence document (fractions of image, 0..1). */
export const HighlightSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  label: z.string().optional(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "cold-open",
    "title",
    "chapter",
    "step",
    "ledger",
    "document",
    "jurisdiction",
    "outro",
  ]),
  /** Spoken narration for this scene. */
  narration: z.string(),
  /** Big headline text (cold-open number, chapter title, etc.). */
  headline: z.string().optional(),
  /** Smaller supporting line under the headline. */
  subhead: z.string().optional(),
  /** Statute / citation printed under a flowchart step. */
  citation: z.string().optional(),
  /** Chapter index shown as a progress ladder ("Step 3 of 7"). */
  chapter: z.number().optional(),
  /** Running ledger figure after this scene, in dollars. */
  ledger: z.number().optional(),
  /** Ledger risk colour: "neutral" | "gold" (money in) | "red" (at risk). */
  ledgerState: z.enum(["neutral", "gold", "red"]).optional(),
  /** Evidence document to show (id into `evidence`). */
  document: z.string().optional(),
  /** Which highlight ids on that document to reveal, in order. */
  highlights: z.array(z.string()).optional(),
  /** Source id (into `sources`) backing this scene's claim. */
  source: z.string().optional(),
  /** Visual beats anchored to narration words. */
  beats: z.array(BeatSchema).optional(),

  /* ---- art direction (new hand-drawn style) ---- */
  /** Tool/prop the presenter shows (credit-card, calendar, gauge, document, …). */
  prop: z.string().optional(),
  /** Numeric prop value (e.g. gauge 0..1). */
  propValue: z.number().optional(),
  /** Text shown on a prop (e.g. calendar day). */
  propDay: z.string().optional(),
  /** Stamp a red mark on a document prop. */
  stamp: z.boolean().optional(),
  /** Character pose: idle, point-right, hold-right, present, cheer, worried, shrug, walk. */
  pose: z.string().optional(),
  /** Character expression: neutral, happy, worried, shocked, sad. */
  expression: z.string().optional(),
  /** Special art mode for a scene (e.g. "stop-paying" intro). */
  art: z.string().optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const SourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  citation: z.string(),
  url: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  /** PNG under episodes/<id>/evidence/, captured by fetch_evidence.py. */
  image: z.string(),
  caption: z.string(),
  url: z.string(),
  accessed: z.string(),
  highlights: z.array(HighlightSchema).default([]),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const CaseSchema = z.object({
  id: z.string(),
  series: z.string(),
  title: z.string(),
  jurisdiction: z.string(),
  character: z.string(),
  accentColor: z.string(),
  voice: z.string().default("en-US-BrianNeural"),
  rate: z.string().default("+6%"),
  scenes: z.array(SceneSchema),
  sources: z.array(SourceSchema),
  evidence: z.array(EvidenceSchema).default([]),
});
export type Case = z.infer<typeof CaseSchema>;

/* ---- Generated manifest types ---- */

export const WordSchema = z.object({
  t: z.number(), // start seconds, relative to scene
  d: z.number(), // duration seconds
  w: z.string(),
});
export type Word = z.infer<typeof WordSchema>;

export const RenderSceneSchema = SceneSchema.extend({
  audio: z.string(), // path relative to manifest
  duration: z.number(), // seconds of audio
  durationInFrames: z.number(),
  words: z.array(WordSchema),
  /** Beats with resolved absolute `at` (seconds into scene). */
  beats: z.array(BeatSchema.extend({ at: z.number() })).default([]),
});
export type RenderScene = z.infer<typeof RenderSceneSchema>;

export const ManifestSchema = CaseSchema.extend({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  totalDurationInFrames: z.number(),
  scenes: z.array(RenderSceneSchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;
