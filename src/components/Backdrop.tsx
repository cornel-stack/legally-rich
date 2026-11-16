import React from "react";
import { AbsoluteFill } from "remotion";

/** Pure white page, like Casual Finance. Nothing competes with the ink. */
export const Backdrop: React.FC<{ accent?: string; ground?: boolean }> = () => {
  return <AbsoluteFill style={{ backgroundColor: "#ffffff" }} />;
};
