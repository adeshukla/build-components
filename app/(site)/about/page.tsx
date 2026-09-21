import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";
import { inStock } from "@/lib/parts";
import { author } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why Build Components exists, how it works, and who makes it.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <TextPage
      title="About"
      intro="Build Components is a catalogue of accessible UI parts you set up on the page and take home as plain code."
    >
      <h2>Why it exists</h2>
      <p>
        The parts people most often get wrong are the ones that look simple: a date picker, a combobox, a mega menu, a
        basket. Getting their keyboard support, focus handling and screen reader output right takes days. Each part
        here does that work once, follows the matching WAI-ARIA Authoring Practices pattern, and is tested before it
        reaches you.
      </p>

      <h2>How it differs from a component library</h2>
      <ul>
        <li>
          <strong>Your options are baked in.</strong> Labels, behaviour, add-ons and colours are written into the file
          you take, so there is nothing to wire up afterwards.
        </li>
        <li>
          <strong>Two outputs from one set of options.</strong> React + Tailwind CSS v4, or HTML, CSS and JavaScript
          with no build step.
        </li>
        <li>
          <strong>The exported code is what gets tested.</strong> Not a demo: the same axe, keyboard and browser tests
          run on both outputs.
        </li>
        <li>
          <strong>No runtime dependency.</strong> Copy the files, or install them with the shadcn CLI. Nothing is loaded
          from this site afterwards.
        </li>
      </ul>

      <h2>What is in stock</h2>
      <p>
        {inStock.length} parts today, from form controls to navigation and overlays. <Link href="/#catalogue">Browse the
        catalogue</Link>, or read how they are checked in the <Link href="/accessibility">accessibility statement</Link>.
      </p>

      <h2>Who makes it</h2>
      <p>
        Built by {author.name}, a UI developer, as part of <a href={author.url}>devstash.me</a>. Found a bug or want a
        part that is not here? Get in touch through <a href={author.url}>devstash.me</a>.
      </p>
    </TextPage>
  );
}
