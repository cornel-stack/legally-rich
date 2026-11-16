import React from "react";
import { ColdOpen } from "./ColdOpen";
import { PresenterStage } from "./PresenterStage";
import { ShotStage } from "./ShotStage";
import { DocumentZoom } from "./DocumentZoom";
import type { Evidence, RenderScene } from "../schema";

export const Scene: React.FC<{
  scene: RenderScene;
  evidence: (Evidence & { imgW?: number; imgH?: number })[];
  accent: string;
  seriesQuestion: string;
}> = ({ scene, evidence, accent, seriesQuestion }) => {
  // fast-cut montage (covers everything, including the intro)
  if (scene.shots && (scene.shots as unknown[]).length)
    return <ShotStage scene={scene} evidence={evidence} accent={accent} />;

  if (scene.kind === "cold-open")
    return <ColdOpen headline={scene.headline ?? "STOP PAYING?"} kicker={scene.subhead ?? seriesQuestion} accent={accent} />;

  if (scene.kind === "document") {
    const ev = evidence.find((e) => e.id === scene.document);
    if (ev) return <DocumentZoom evidence={ev} beats={(scene.beats ?? []) as any} sceneDurationSec={scene.duration} accent={accent} headline={scene.headline} expression={scene.expression} />;
  }
  return <PresenterStage scene={scene} accent={accent} />;
};
