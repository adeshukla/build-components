---
name: Build Components
description: Accessible UI parts, configured visually and taken home as plain code.
colors:
  paper: "#f5f2ec"
  paper-sunk: "#ece7de"
  ink: "#1c1a17"
  ink-muted: "#56514a"
  rule: "#e2ddd3"
  rule-strong: "#8a8378"
  accent: "#c2410c"
  accent-strong: "#9a3412"
  on-accent: "#ffffff"
  link: "#9a3412"
  glass: "#ffffff85"
  glass-edge: "#ffffffbf"
  pass: "#13744a"
  dark-paper: "#0f0d0b"
  dark-ink: "#f1ede6"
  dark-accent: "#fb923c"
  dark-glass: "#1c181580"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(2.75rem, 7.5vw, 5.25rem)"
    fontWeight: 400
    lineHeight: 1.02
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "3rem–3.75rem"
    fontWeight: 400
    lineHeight: 1.05
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  control: "9999px"
  card: "16px"
  panel: "20px"
  band: "32px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  section: "clamp(56px, 7vw, 96px)"
---

# Design System: Build Components

## Overview

**Creative North Star: "The Frosted Shelf"** (D71, replacing D19's Parts Datasheet)

Every part sits on a shelf where it can be recognised before it is read: each catalogue card carries a
small drawing of the part. Warm paper, one burnt-orange accent, and frosted glass surfaces
(translucent, lit along the top edge) over a faint, grained orange, amber and rose glow that stays
behind the page as it scrolls. Search is the hero: most people arrive knowing roughly what they want.

The reference demo is `scratchpad/design-directions.html` (direction E), gitignored and kept locally.

**Key characteristics:**
- Warm paper, ink text, one orange accent.
- Frosted glass for chrome, tiles, cards and bands; the glow behind is fixed and faint.
- A serif display face (one weight, upright and italic) over a calm sans.
- A drawing of every part, so the catalogue is scanned by eye.
- Quiet motion: small spring lifts, drawings that play on hover or focus, a soft ring on the search box.

## Colors

- **Paper** / **Sunk paper**: the page, and wells such as code blocks and the part header.
- **Ink** / **Muted ink**: text. Muted ink is 4.5:1 even where the glow is brightest behind it, measured
  as if the glow were a flat tint. That, not taste, caps the glow at 14% at its centre.
- **Accent** (orange): fills, focus rings, large text, the changed-option dot. **Link** is the darker
  orange for small text in the accent; the accent itself is only 4.3:1 on sunk paper.
- **Rule** / **Strong rule**: dividers; strong rule outlines fields (3:1).
- **Glass**: translucent paper, with an edge and a lit top line. Solid under
  `prefers-reduced-transparency`.
- **Pass green**: PASS stamps only.

Dark theme: near-black paper (#0f0d0b), warm off-white ink, a lighter orange (#fb923c) with dark text on
it, and dark glass. Preview and test-harness pages keep a plain white or #141020 page, so parts are
tested on the kind of page they will live on, not on the site's paper.

## Typography

- **Display** (Instrument Serif 400): the home headline, whose second line is italic and orange; page
  and section titles. One weight only: `font-synthesis-weight: none` stops a bold class faking one.
- **Body** (Geist): copy, part names on cards (600).
- **Mono** (Geist Mono): data, part types and groups, keyboard keys, code.

## Surfaces

- `glass`: translucent with a lit top edge, for every surface: header, footer, search box, bands, tiles,
  cards. **No `backdrop-filter`**, and the grain lives once on the fixed glow layer, not on each surface.
  Measured (`scratchpad/perf.mjs`): the full-screen blurred glow with drifting shapes made nearly every
  scrolled frame 100ms; backdrop blur and per-card grain cost the rest. The glow is now static
  gradients that drift by transform only, and all that sits behind the glass is that glow, so a blur
  looked the same anyway.
- On phones the glass bands run edge to edge: the parts inside need the width.

## Components

- **Search box** (signature): large glass field, magnifier, a `/` key hint, suggested words under it.
  `/` and Ctrl K (⌘K) focus it. Search reads each part's name, summary, pattern, type, group, slug and
  its `aka` words, and a card found only by an `aka` word says so ("also called 'popup'").
- **Type tiles**: native radios drawn as glass tiles with the count in the display face and two
  drawings. While searching they shrink to name and count, so the results come up to the box.
- **Group chips**: a second radio group under a chosen type. Selected is ink with paper text.
- **Catalogue card** (signature): the part's drawing on a panel tinted with its accent, name, "type ·
  group", the summary. Pointing at or focusing the card plays its drawing; there is no live preview
  on hover (D72).
- **Buttons**: `btn-accent` (orange pill), `btn-glass` (glass pill), `btn-ink`. Pills lift 2px on a
  spring.
- **PASS stamp**: pass-green border, mono caps, rotated -6°.

## Motion

Springs (`--ease-spring`, a `linear()` curve) for lifts and drawings; View Transitions when a filter
changes the grid; scroll-driven reveals where supported. The glow drifts by `transform` only (no filter,
so the compositor moves it without repainting). Cards, tiles and buttons press in on a spring, and opening
a card morphs its drawing into the part page header (React `<ViewTransition>`). Everything stops
under `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** give every new part a group, `aka` words and a drawing (`components/part-drawing.tsx`); the
  home spec fails without them.
- **Do** keep the drawing true to the part. It is a sketch of the real thing, not decoration.
- **Don't** raise the glow's strength: axe cannot see through gradients, so check muted text by hand.
- **Don't** add `backdrop-filter`, `filter: blur()` or an animation to anything that stays on screen
  while scrolling. Measure with `scratchpad/perf.mjs` first.
- **Don't** put the accent as small text on sunk paper; use `text-link`.
- **Don't** invent usage numbers, customers or benchmarks.
