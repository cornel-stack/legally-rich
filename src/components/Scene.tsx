import React from "react";
import { ColdOpen } from "./ColdOpen";
import { FlowStep } from "./FlowStep";
import { DocumentZoom } from "./DocumentZoom";
import { TextCard } from "./TextCard";
import type { Evidence, RenderScene } from "../schema";

export const Scene: React.FC<{
  scene: RenderScene;
  evidence: (Evidence & { imgW?: number; imgH?: number })[];
  accent: string;
  seriesQuestion: string;
}> = ({ scene, evidence, accent, seriesQuestion }) => {
  switch (scene.kind) {
    case "cold-open":
      return (
        <ColdOpen
          kicker={scene.subhead ?? seriesQuestion}
          headline={scene.headline ?? ""}
          subhead={undefined}
          accent={accent}
        />
      );
    case "title":
      return <TextCard kicker={seriesQuestion} headline={scene.headline ?? ""} subhead={scene.subhead} accent={accent} />;
    case "chapter":
      return (
        <TextCard
          kicker={scene.chapter ? `Step ${scene.chapter}` : undefined}
          headline={scene.headline ?? ""}
          subhead={scene.subhead}
          accent={accent}
        />
      );
    case "jurisdiction":
      return <TextCard kicker="Where you live changes this" headline={scene.headline ?? ""} subhead={scene.subhead} accent={accent} />;
    case "outro":
      return <TextCard kicker="What this means for you" headline={scene.headline ?? ""} subhead={scene.subhead} accent={accent} disclaimer />;
    case "step":
    case "ledger":
      return (
        <FlowStep
          headline={scene.headline ?? ""}
          subhead={scene.subhead}
          citation={scene.citation}
          ledgerState={scene.ledgerState}
          accent={accent}
          chapter={scene.chapter}
        />
      );
    case "document": {
      const ev = evidence.find((e) => e.id === scene.document);
      if (!ev) return <TextCard headline="[missing evidence]" accent={accent} />;
      return (
        <DocumentZoom
          evidence={ev}
          beats={(scene.beats ?? []) as (typeof scene.beats)[number][] as any}
          sceneDurationSec={scene.duration}
          accent={accent}
        />
      );
    }
    default:
      return <TextCard headline={scene.headline ?? ""} subhead={scene.subhead} accent={accent} />;
  }
};
