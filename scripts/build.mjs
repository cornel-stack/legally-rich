#!/usr/bin/env node
/**
 * End-to-end episode build.
 *
 *   node scripts/build.mjs [episode-dir] [--frames=0-900] [--no-tts]
 *
 * Steps:
 *   1. TTS         (edge-tts Brian; cached by narration hash)
 *   2. Manifest    (durations + word-synced beats)
 *   3. Render      (Remotion headless, serving the episode dir as public/)
 *
 * Evidence PNGs are captured separately (npm run evidence) and committed to the
 * repo, so the render is reproducible on CI without re-hitting court websites.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const epDir = args.find((a) => !a.startsWith("--")) ?? "episodes/ep01-credit-card";
const framesArg = args.find((a) => a.startsWith("--frames="));
const noTts = args.includes("--no-tts");
const epId = basename(epDir);

const run = (cmd, cmdArgs) => {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  execFileSync(cmd, cmdArgs, { stdio: "inherit" });
};

mkdirSync("out", { recursive: true });

if (!noTts) run("python3", ["scripts/tts.py", epDir]);
run("node", ["scripts/build_manifest.mjs", epDir]);

if (!existsSync(`${epDir}/render-manifest.json`)) {
  console.error("manifest missing — aborting render");
  process.exit(1);
}

const renderArgs = [
  "remotion",
  "render",
  "src/index.ts",
  "Episode",
  `out/${epId}.mp4`,
  `--public-dir=${epDir}`,
  "--log=info",
];
if (framesArg) renderArgs.push(framesArg);

run("npx", renderArgs);
console.log(`\n✔ done -> out/${epId}.mp4`);
