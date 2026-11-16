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

const RED = "#d1483a";
const GREEN = "#2f9e60";

/**
 * Turn a scene into FAST CUTS (~2.3s each, Casual-Finance pace). Every scene —
 * including the intro — becomes a run of short cut-scenes, each animating a few
 * things. Cuts are built from the scene's own assets (prop, evidence highlights,
 * number, citation, stamps) and sequenced to avoid adjacent repeats.
 */
const CUT_SEC = 2.3;

function genShots(scene, words, durFrames, evMap) {
  const durSec = durFrames / FPS;
  const headline = scene.headline ?? "";
  const color = scene.ledgerState === "gold" ? GREEN : RED;
  const evId = scene.document || scene.evidence;
  const ev = evId ? evMap[evId] : null;
  const nHl = ev && ev.highlights ? ev.highlights.length : 0;
  const numberShot = () => ({ kind: "number", value: scene.ledger, label: scene.ledgerState === "gold" ? "cleared" : "owed", color });
  const stampText = headline.length <= 22 ? headline : (scene.subhead && scene.subhead.length <= 22 ? scene.subhead : headline.slice(0, 20));

  const N = Math.max(3, Math.round(durSec / CUT_SEC));

  // --- establishing beats (contextual order) + a rotation pool to fill the rest ---
  let lead = [];
  let pool = [];

  if (scene.kind === "cold-open") {
    lead = [{ kind: "number", value: 3000, label: "one card", color: RED }, { kind: "cardx" }, { kind: "stamp", text: headline || "STOP PAYING?" }, { kind: "teaser" }];
    pool = [{ kind: "cardx" }, { kind: "stamp", text: "7 YEARS?" }, { kind: "teaser" }, { kind: "number", value: 3000, label: "one card", color: RED }, { kind: "stamp", text: headline || "STOP PAYING?" }];
  } else if (!scene.prop && !ev && scene.ledger == null) {
    // character-only scene
    lead = [{ kind: "headline", text: headline, pose: "present", expr: scene.expression || "happy" }, { kind: "bubble", text: scene.subhead || headline, pose: "point-right", expr: "neutral" }, { kind: "stamp", text: stampText }];
    pool = [{ kind: "bubble", text: scene.subhead || headline, pose: "point-right" }, { kind: "stamp", text: stampText }, { kind: "headline", text: headline, pose: "shrug" }];
  } else {
    if (scene.prop) lead.push({ kind: "prop", prop: scene.prop, value: scene.propValue, label: scene.subhead, stamp: scene.stamp });
    else lead.push({ kind: "headline", text: headline });
    if (ev) lead.push({ kind: "doc", doc: evId, hl: 0, note: scene.evidenceNote });
    if (scene.ledger != null) lead.push(numberShot());

    if (ev) for (let i = 0; i < nHl; i++) pool.push({ kind: "doc", doc: evId, hl: i, note: scene.evidenceNote });
    if (scene.ledger != null) pool.push(numberShot());
    if (scene.citation) pool.push({ kind: "cite", text: scene.citation });
    pool.push({ kind: "stamp", text: stampText });
    if (scene.prop) pool.push({ kind: "prop", prop: scene.prop, value: scene.propValue });
  }
  if (pool.length === 0) pool = [{ kind: "headline", text: headline }];

  // build sequence: lead, then cycle pool skipping adjacent duplicates
  const shots = [...lead];
  let pi = 0, guard = 0;
  const sig = (s) => s.kind + (s.hl ?? "") + (s.text ?? "") + (s.prop ?? "");
  while (shots.length < N && guard++ < 200) {
    const cand = pool[pi % pool.length]; pi++;
    if (shots.length && sig(shots[shots.length - 1]) === sig(cand)) continue;
    shots.push({ ...cand });
  }

  // distribute cut times evenly, snapped to nearest spoken word, min 1.1s apart
  let last = -999;
  shots.forEach((s, i) => {
    const target = (i / shots.length) * durSec;
    let best = target, bd = 1e9;
    for (const w of words) { const d = Math.abs(w.t - target); if (d < bd) { bd = d; best = w.t; } }
    let st = i === 0 ? 0 : best;
    if (st - last < 1.1) st = last + 1.1;
    last = st;
    s.start = Math.round(st * FPS);
  });
  for (let i = 0; i < shots.length; i++) shots[i].dur = (i < shots.length - 1 ? shots[i + 1].start : durFrames) - shots[i].start;
  return shots.filter((s) => s.dur > 3);
}

const evMap = Object.fromEntries((caseData.evidence ?? []).map((e) => [e.id, e]));

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

  // fast-cut shot list (hand-authored shots win; else auto-generate)
  const shots =
    scene.shots && scene.shots.length ? scene.shots : genShots(scene, words, durationInFrames, evMap);

  const rendered = {
    ...scene,
    audio: `audio/${basename(mp3)}`,
    duration,
    durationInFrames,
    words,
    beats,
    shots,
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
