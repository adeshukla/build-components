import { ImageResponse } from "next/og";
import { inStock } from "@/lib/parts";

export const alt = "Build Components: accessible parts, plain code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card: the board colours and the hero headline. */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#25154d",
        color: "#f3efff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
        Build Components
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 800, lineHeight: 1 }}>
        <span>Accessible parts.</span>
        <span style={{ color: "#e6b24a" }}>Plain code.</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#c9bfe8" }}>
        {`${inStock.length} tested components · React + Tailwind or HTML/CSS/JS`}
      </div>
    </div>,
    size,
  );
}
