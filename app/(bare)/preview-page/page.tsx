import type { Metadata } from "next";
import { BuiltPagePreview } from "@/components/template-page";

export const metadata: Metadata = { title: "Page preview", robots: { index: false } };

/** A page from the builder, rendered from its real parts inside the builder's frame (D80). */
export default function PagePreviewPage() {
  return <BuiltPagePreview />;
}
