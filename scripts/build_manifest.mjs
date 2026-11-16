#!/usr/bin/env node
/**
 * Merge case.json + generated audio into render-manifest.json.
 *
 *   node scripts/build_manifest.mjs episodes/ep01-credit-card
 *
 * For every scene it:
 *   - reads the word timings from audio/<id>.words.json
 *   - measures the exact mp3 duration with ffprobe
 *   - resolves each visual beat's `anchor` substring to the start time of the
 *     matching narration word (so animations fire exactly on the spoken word)
 *   - computes durationInFrames (audio + a short breathing tail)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const TAIL_SECONDS = 0.45; // silence/breathing room after each scene

const epDir = process.argv[2];
if (!epDir) {
  console.error("usage: build_manifest.mjs <episode-dir>");
  process.exit(1);
}

const caseData = JSON.parse(readFileSync(join(epDir, "case.json"), "utf8"));

/** Read intrinsic pixel size from a PNG header (IHDR at byte 16). */
function pngSize(file) {
  const buf = readFileSync(file);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function ffprobeDuration(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" }
  );
  return parseFloat(out.trim());
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$% ]/g, "").replace(/\s+/g, " ").trim();

/** Resolve an anchor phrase to the start time (s) of the first matching word run. */
function resolveAnchor(anchor, words) {
  const target = norm(anchor).split(" ").filter(Boolean);
  if (target.length === 0) return 0;
  const w = words.map((x) => norm(x.w));
  for (let i = 0; i <= w.length - target.length; i++) {
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (w[i + j] !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return words[i].t;
  }
  // soft fallback: first word that contains the anchor's first token
  const idx = w.findIndex((x) => x.includes(target[0]));
  return idx >= 0 ? words[idx].t : 0;
}

let frameCursor = 0;
const scenes = caseData.scenes.map((scene) => {
  const mp3 = join(epDir, "audio", `${scene.id}.mp3`);
  const wordsFile = join(epDir, "audio", `${scene.id}.words.json`);
  const words = JSON.parse(readFileSync(wordsFile, "utf8"));
  const duration = ffprobeDuration(mp3);
  const durationInFrames = Math.ceil((duration + TAIL_SECONDS) * FPS);

  const beats = (scene.beats ?? []).map((b) => ({
    ...b,
    at: b.at != null ? b.at : resolveAnchor(b.anchor ?? "", words),
  }));
  // keep beats in chronological order
  beats.sort((a, b) => a.at - b.at);

  const rendered = {
    ...scene,
    audio: `audio/${basename(mp3)}`,
    duration,
    durationInFrames,
    words,
    beats,
    startFrame: frameCursor,
  };
  frameCursor += durationInFrames;
  return rendered;
});

// attach intrinsic pixel size to each evidence image for the DocumentZoom camera
const evidence = (caseData.evidence ?? []).map((e) => {
  if (!e.image) return e;
  try {
    const size = pngSize(join(epDir, e.image));
    return size ? { ...e, imgW: size.w, imgH: size.h } : e;
  } catch {
    return e;
  }
});

const manifest = {
  ...caseData,
  evidence,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
  totalDurationInFrames: frameCursor,
  scenes,
};

const outPath = join(epDir, "render-manifest.json");
writeFileSync(outPath, JSON.stringify(manifest, null, 2));

const mins = (frameCursor / FPS / 60).toFixed(2);
console.log(
  `manifest: ${scenes.length} scenes, ${frameCursor} frames @ ${FPS}fps = ${mins} min -> ${outPath}`
);
