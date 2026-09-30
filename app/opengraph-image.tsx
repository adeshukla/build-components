import { ImageResponse } from "next/og";
import { inStock } from "@/lib/parts";

export const alt = "Build Components: accessible parts, plain code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card: warm paper, the orange glow and the hero headline. */
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
        background:
          "radial-gradient(circle at 10% 0%, rgba(194,65,12,0.28), transparent 55%), radial-gradient(circle at 95% 60%, rgba(190,24,93,0.18), transparent 50%), #f5f2ec",
        color: "#1c1a17",
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40 }}>
        <div style={{ display: "flex", width: 52, height: 52, borderRadius: 15, background: "#c2410c" }} />
        Build Components
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 108, lineHeight: 1.02 }}>
        <span>{`${inStock.length} accessible parts.`}</span>
        <span style={{ color: "#c2410c", fontStyle: "italic" }}>Find yours by looking.</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#5f5a52", fontFamily: "sans-serif" }}>
        {`${inStock.length} tested components · React + Tailwind or HTML/CSS/JS`}
      </div>
    </div>,
    size,
  );
}
