import type { Metadata } from "next";
import { MotionReel } from "@/components/motion-reel";

export const metadata: Metadata = { title: "Reel", robots: { index: false } };

/** The home page reel, on its own page so the hero can show it in an inert, sandboxed frame (D79). */
export default function ReelPage() {
  return <MotionReel />;
}
