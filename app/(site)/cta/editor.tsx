"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { CtaConfig } from "@/registry/cta/react/cta";
import { ctaSchema } from "@/registry/cta/schema";
import { renderCtaHtml } from "@/registry/cta/vanilla/render";

const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move between the buttons. There is nothing else to focus."],
  [["Enter"], "Follow the focused link."],
];

const checklist = [
  "Screen reader: the section is announced with its heading, and the heading level fits the page.",
  "The button text makes sense on its own, out of context, in a list of links.",
  "Your accent colour keeps button text readable (the component picks black or white for you).",
  "Browser zoom at 200%: the heading and buttons still fit without sideways scrolling.",
  "Windows High Contrast / forced colours: buttons still look like buttons.",
  "On a real iPhone in Safari: buttons are easy to tap and nothing is cut off at the edges.",
];

export function CtaEditor({ initialConfig, sources }: { initialConfig: CtaConfig; sources: Sources }) {
  return (
    <Editor
      slug="cta"
      schema={ctaSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
      vanillaHtml={(config) => renderCtaHtml(config as unknown as CtaConfig)}
    />
  );
}
