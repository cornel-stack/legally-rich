import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "./components/Backdrop";
import { Hud } from "./components/Hud";
import { Captions } from "./components/Captions";
import { Scene } from "./components/Scene";
import { print, palette } from "./lib/theme";
import type { Manifest, RenderScene } from "./schema";

/** Fades scene content in at its start and out at its end for soft cuts. */
const SceneFade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(
    frame,
    [0, 7, durationInFrames - 7, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity: fade }}>{children}</AbsoluteFill>;
};

export const Episode: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const accent = manifest.accentColor;
  const scenes = manifest.scenes as (RenderScene & { startFrame: number })[];
  const seriesQuestion = manifest.title;

  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />

      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames} name={scene.id}>
          <Audio src={staticFile(scene.audio)} />
          <SceneFade durationInFrames={scene.durationInFrames}>
            <Scene scene={scene} evidence={manifest.evidence as any} accent={accent} seriesQuestion={seriesQuestion} />
            <Captions words={scene.words} accent={accent} />
          </SceneFade>
        </Sequence>
      ))}

      {/* persistent HUD above everything */}
      <Hud scenes={scenes} series={manifest.series} jurisdiction={manifest.jurisdiction} accent={accent} />

      {/* persistent educational footer */}
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 30,
          fontFamily: print,
          fontSize: 24,
          color: palette.inkSoft,
          opacity: 0.75,
        }}
      >
        Educational — not legal advice
      </div>
    </AbsoluteFill>
  );
};
