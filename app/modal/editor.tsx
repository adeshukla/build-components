"use client";

import { useState } from "react";
import { Editor, type Sources } from "@/components/editor";
import { Modal, type ModalAction, type ModalConfig } from "@/registry/modal/react/modal";
import { modalSchema } from "@/registry/modal/schema";

const checklist = [
  "Screen reader (NVDA or Narrator): opening announces the dialog with its title and body text.",
  "Focus starts on the title (or the primary button, if set), and Tab / Shift+Tab never leave the dialog.",
  "Escape closes the dialog and focus returns to the trigger button.",
  "The page behind the open dialog doesn't scroll.",
  "With reduced motion turned on in Windows settings, the dialog opens without animation.",
  "Phone width and 200% zoom: long body text scrolls inside the dialog and every button stays reachable.",
  "Bottom position on phone width: the sheet sits flush with the bottom edge.",
];

function ModalPreview({ config }: { config: ModalConfig }) {
  const [lastAction, setLastAction] = useState<ModalAction | null>(null);
  return (
    <div className="space-y-3">
      <Modal config={config} onAction={setLastAction} />
      <p className="text-sm text-neutral-600" aria-live="polite">
        {lastAction ? `Closed with: ${lastAction}` : "Not closed yet."}
      </p>
    </div>
  );
}

export function ModalEditor({ initialConfig, sources }: { initialConfig: ModalConfig; sources: Sources }) {
  return (
    <Editor
      slug="modal"
      schema={modalSchema}
      initialConfig={initialConfig}
      sources={sources}
      checklist={checklist}
      renderPreview={(config) => <ModalPreview config={config as ModalConfig} />}
    />
  );
}
