---
name: Build Components
description: Accessible UI parts, configured visually and taken home as plain code.
colors:
  board: "#25154d"
  board-raised: "#33206a"
  board-line: "#4f3a8f"
  silk: "#f3efff"
  silk-muted: "#c9bfe8"
  pad: "#e6b24a"
  pad-strong: "#f2c566"
  paper: "#ffffff"
  paper-sunk: "#f5f3fa"
  ink: "#16121f"
  ink-muted: "#534c63"
  rule: "#dcd6ea"
  rule-strong: "#8c83a3"
  pass: "#13744a"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.5rem, 10vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.025em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  panel: "16px"
  section: "80px"
components:
  button-pad:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.board}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-pad-hover:
    backgroundColor: "{colors.pad-strong}"
  button-outline-board:
    textColor: "{colors.silk}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  segmented-selected:
    backgroundColor: "{colors.board}"
    textColor: "{colors.silk}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel}"
---

# Design System: Build Components

## Overview

**Creative North Star: "The Parts Datasheet"**

Every component is a part in a catalogue: it has a part number, a spec line, a pinout (its keyboard map), a test report, and an order code (the install command). The site borrows the two materials of electronics: the solder-mask board and the white datasheet. Purple board carries identity (header, footer, home hero and closing bands). White paper carries the work (catalogue, editor, code). Gold contact pads mark what is live and what to press.

Density follows the task. Home is spacious and speaks in large condensed slabs. The editor is a working instrument: organised by what the developer is trying to do, with tabs per option group, search across every option, and visible "changed" state. Motion happens once and means something: traces draw in, pins light up, changed code lines flash gold, a ticked check gets its PASS stamp. All of it switches off under reduced motion.

**Key Characteristics:**
- Two materials: purple board for identity, white datasheet paper for work.
- Gold pads for live, active and primary.
- Condensed uppercase display type; plain sans for reading; mono only for part numbers, data and code.
- Real, running components as the imagery.
- Accessibility shown as a feature: keyboard maps, test reports, PASS stamps.

## Colors

A committed two-material palette: deep solder-mask purple and white paper, with one gold accent that means "live" or "act".

### Primary
- **Solder-Mask Purple** (board): header, footer, home hero, closing bands, the install command bar, selected segments. It carries 30–50% of home and a thin frame on working pages.
- **Contact-Pad Gold** (pad): primary buttons on board, pins, trace pads, the active nav underline, changed-option dots, the code-line flash, text selection. Never as text on white: it fails contrast there.

### Neutral
- **Raised Board** (board-raised) and **Board Trace** (board-line): hover surfaces and traces/dot grid on board.
- **Silkscreen** (silk) and **Faded Silkscreen** (silk-muted): text on board. Faded silkscreen still clears 8:1.
- **Datasheet Paper** (paper) and **Sunk Paper** (paper-sunk): working surfaces, and the part header and panel footers.
- **Ink** (ink) and **Muted Ink** (ink-muted): body text and secondary text on paper (7:1+).
- **Rule** (rule) and **Strong Rule** (rule-strong): hairline dividers; strong rules for control borders (3:1+ non-text contrast).
- **Pass Green** (pass): PASS stamps only.

### Named Rules
**The Two Materials Rule.** A surface is either board or paper. Never mix them in a gradient or tint one toward the other.

**The Gold Means Live Rule.** Gold marks what is live, changed or clickable-primary. Decoration in gold dilutes it.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow)
**Body Font:** Geist (with system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** Condensed industrial caps, like part labels on a datasheet, over a calm, highly legible sans.

### Hierarchy
- **Display** (700, clamp(3.5rem, 10vw, 6rem), 0.88): home hero only, set as stacked slabs.
- **Headline** (700, 3rem–3.75rem, 1): section and page titles, uppercase.
- **Title** (600, 1.5rem–1.875rem, 1): panel titles (Configure, Test bench, Take it home) and catalogue part names, uppercase.
- **Body** (400, 1rem–1.125rem, 1.5): descriptions and copy; measure kept under ~70ch.
- **Label** (400, 0.75rem, uppercase for table headers): part numbers, spec terms, line counts, captions.

### Named Rules
**The Mono Is Data Rule.** Monospace only for part numbers, measurements, code and table data, never as a "technical" costume.

**The No Kicker Rule.** No small label above a heading. Part numbers sit beside or below the name, never above it.

## Layout

A 7xl container (max 80rem) with 16px gutters on phones and 24px from `sm`. Home sections breathe at 80px vertical padding. Component pages use a two-column working layout from `lg`: a 22rem sticky options panel on the left (it scrolls on its own, capped at the viewport height), and the test bench and "Take it home" panels on the right. Below `lg` everything stacks in task order: configure, test, take home. Tables collapse their explanation column under the first cell on phones.

## Elevation & Depth

Mostly flat, with tonal layering (paper against sunk paper, board against raised board). Shadows are soft, offset and reserved for things that sit on top of a surface.

### Shadow Vocabulary
- **Mounted part** (`box-shadow: 0 30px 60px -24px rgb(8 3 24 / 0.7)`): live components mounted on the board.
- **Bench frame** (`box-shadow: 0 14px 32px -18px rgb(22 18 31 / 0.4)`): the preview frame on the test bench.
- **Pad glow** (`box-shadow: 0 10px 24px -12px rgb(230 178 74 / 0.75)`): primary gold buttons.

### Named Rules
**The Mounted Only Rule.** Only mounted parts, the bench frame and primary gold buttons cast shadows. Panels are bordered, not lifted.

## Shapes

Small, precise radii: 4px for segments and tags, 6px for inputs and buttons, 8px for panels and mounted parts, full circles for pads and switch thumbs. Hairline 1px rules divide; a 2px ink rule underlines section titles like a datasheet header. The chip notch (a half-circle bite at the top edge) marks a mounted part.

## Components

### Buttons
- **Shape:** gently squared (6px).
- **Primary (on board):** gold pad with purple text, 12px × 20px, soft gold glow; lifts 2px on hover.
- **Outline (on board):** silkscreen text with a faded-silkscreen border; hover fills with raised board.
- **Copy buttons (on paper):** strong-rule border, icon plus a label naming the action; they swap to a check mark and "Copied", and announce it politely.

### Segmented controls and switches
- **Segments:** native radio groups drawn as a strip. The selected segment is solid purple with silkscreen text. Used for short choices, output and screen width.
- **Switches:** add-ons are `role="switch"` toggles. Off: sunk paper track with a strong-rule thumb. On: purple track with a gold thumb that slides with an expo ease.

### Tabs
- WAI-ARIA tabs with automatic activation (arrows, Home, End). The active tab takes ink text and a 2px purple indicator that slides between tabs. Tab labels carry counts: the changed-options badge, a gold circle, or the checklist's x/n.

### Inputs / Fields
- **Style:** white paper, strong-rule border, 6px radius, 8px × 12px.
- **Focus:** 2px purple outline with a 2px offset (gold on board).
- **Search:** leading magnifier icon; results show each option's group as a tag.

### Navigation
- Board header with the chip-mark logo and condensed uppercase wordmark. Links show gold part numbers from `md`. The current page gets a gold underline that scales in.

### Catalogue row (signature)
- Part number with a pad dot (filled gold when in stock, hollow when coming), condensed part name, summary and pattern, and an action. Coming parts get a dashed "Coming soon" tag and no link. Rows reveal on scroll where supported.

### PASS stamp (signature)
- Pass-green 2px border, condensed caps, rotated -6°. Stamps in (scale and rotate) when a manual check is ticked; static in the test report.

## Do's and Don'ts

### Do:
- **Do** mount real, running components as the imagery; the component is the proof.
- **Do** keep every option's one-line description visible under its control.
- **Do** mark changed options (gold dot, "Changed", per-option Reset) and count them on their group tab.
- **Do** switch every animation off under `prefers-reduced-motion`.
- **Do** use gold on board or as a fill; for text on paper use purple or ink.

### Don't:
- **Don't** put a kicker or eyebrow label above a heading.
- **Don't** use monospace for anything that isn't a part number, data or code.
- **Don't** set gold text on white paper (2:1 contrast).
- **Don't** add grid-paper backgrounds outside measuring surfaces (the test bench is the one place).
- **Don't** invent usage numbers, customers or benchmarks; the test report states only what the tests check.
