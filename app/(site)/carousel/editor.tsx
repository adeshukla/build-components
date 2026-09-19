"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { CarouselConfig } from "@/registry/carousel/react/carousel";
import { carouselSchema } from "@/registry/carousel/schema";
import { renderCarouselHtml } from "@/registry/carousel/vanilla/render";

const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to the slide row, then to the buttons and dots under it."],
  [["← →"], "Scroll the slide row while it has focus."],
  [["Enter", "Space"], "Press the focused button: previous, next, a dot, or stop and start."],
];

const checklist = [
  "Screen reader: the carousel and each slide are announced as such, with the slide's position.",
  "The slide row itself takes focus, so someone using only a keyboard can scroll it.",
  "With automatic rotation on: it stops when you move into it, and the stop button works.",
  "Reduced motion: slides jump instead of gliding, and automatic rotation never starts.",
  "Any image you add has a description that says what it shows, or is left decorative on purpose.",
  "Browser zoom at 200%: the buttons and dots stay on screen and reachable.",
  "On a real iPhone in Safari: slides swipe naturally and snap into place.",
];

export function CarouselEditor({ initialConfig, sources }: { initialConfig: CarouselConfig; sources: Sources }) {
  return (
    <Editor
      slug="carousel"
      schema={carouselSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
      vanillaHtml={(config) => renderCarouselHtml(config as unknown as CarouselConfig)}
    />
  );
}
