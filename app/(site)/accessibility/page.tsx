import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { author } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description: "What Build Components aims for, how every part is tested, and the limits of that testing.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <TextPage
      title="Accessibility"
      intro="Every part aims to meet WCAG 2.2 level AA, in the code you take home as well as on this site."
    >
      <h2>How parts are tested</h2>
      <ul>
        <li>axe accessibility rules for WCAG 2.0, 2.1 and 2.2, levels A and AA, with each part closed and open.</li>
        <li>Keyboard-only flows: open, move, pick and close without a mouse, with focus returned where it came from.</li>
        <li>Target sizes of at least 24 by 24 CSS pixels, and no sideways scrolling at phone widths.</li>
        <li>Chromium, WebKit (the engine behind Safari) and an emulated iPhone 15.</li>
        <li>
          The same tests run on both exported outputs, React + Tailwind and HTML/CSS/JS, for every variant of the
          options.
        </li>
      </ul>

      <h2>Patterns followed</h2>
      <p>
        Interactive parts follow the WAI-ARIA Authoring Practices Guide: combobox, dialog, menu button, tabs, accordion,
        disclosure, carousel and tooltip. Each part&apos;s page lists its pattern and the keys it answers to.
      </p>

      <h2>Known limits</h2>
      <ul>
        <li>
          Automated tests cannot judge what a screen reader actually says. Each part has a manual checklist on its page,
          including what a screen reader should announce, to run with the one you use.
        </li>
        <li>WebKit in the test runner is close to Safari but not identical; a real-device check stays on the checklist.</li>
        <li>
          Colours you choose in the editor can lower contrast. Accent colours used as text are corrected automatically,
          but check your final palette.
        </li>
        <li>Once the code is in your project, what you change is yours to test.</li>
      </ul>

      <h2>Report a problem</h2>
      <p>
        If something on this site or in an exported part does not work with your assistive technology, please tell{" "}
        {author.name} through <a href={author.url}>devstash.me</a>, with the part, the browser and the tool you used.
      </p>
    </TextPage>
  );
}
