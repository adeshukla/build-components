"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { HeaderConfig } from "@/registry/header/react/header";
import { headerSchema } from "@/registry/header/schema";
import { renderHeaderHtml } from "@/registry/header/vanilla/render";

const keyboard: KeyboardRow[] = [
  [["Tab"], "First stop is the skip link, then the logo, the links, and the call to action."],
  [["Enter", "Space"], "On the menu button: open or close the small-screen menu."],
  [["Escape"], "Close the menu and put focus back on the menu button."],
  [["Enter"], "Follow the focused link. Choosing a link also closes the menu."],
];

const checklist = [
  "Narrow the window until the menu button appears: the links move into the menu, nothing is lost.",
  "Screen reader: the header is announced as a banner and the menu button says whether it is expanded.",
  "Open the menu, then press Escape: it closes and focus is back on the button.",
  "Tab from the very top of the page: the skip link appears and jumps past the navigation.",
  "The current page link is marked (it uses the browser address, so check it on a real page).",
  "On a real iPhone in Safari: the menu opens, links are easy to tap, and nothing sits under the notch.",
];

export function HeaderEditor({ initialConfig, sources }: { initialConfig: HeaderConfig; sources: Sources }) {
  return (
    <Editor
      slug="header"
      schema={headerSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
      vanillaHtml={(config) => renderHeaderHtml(config as unknown as HeaderConfig)}
    />
  );
}
