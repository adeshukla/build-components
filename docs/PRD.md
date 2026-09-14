# PRD — Component Platform (working name)

Last updated: 2026-09-15

## Vision
Developers build the UI components their projects need much faster, by configuring ready-made, accessible components visually and taking them home as plain code they own. Long term, the same component is available for every popular framework.

## Problem
- Component libraries add a runtime dependency, a styling system and upgrade churn users don't control.
- Copy-paste collections (e.g. shadcn/ui) give ownership, but every change beyond the defaults means editing code by hand.
- Details that take the most time — keyboard support, ARIA, accurate validation messages, date formats — are exactly the ones most often skipped.

## Target users
- Front-end and full-stack developers shipping marketing sites, landing pages and product UI.
- Freelancers and agency developers who rebuild the same header/form/modal across many projects.
- Developers on React + Tailwind, or on no framework at all (plain HTML/CSS/JS).
- [TODO: validate with real user conversations — no research done yet]

## Core idea: control without code
Per component, users change as much as possible without writing code:
- Content: labels, text, helper text.
- Style: colours, spacing, sizes, radius.
- Add-ons toggled on/off (clear button, icons, helper text, today button…).
- Behaviour options (date format, single vs range selection, validation timing…).

## Delivery
- **Copy code** — plain source the user owns.
- **Install by URL** — shadcn-compatible registry: `npx shadcn add https://<site>/r/<component>.json?<config>` writes real files into the project.
- No hosted render API or embed script.

## MVP scope
Components (6): form with custom validation, searchable select, date picker, modal/popup, CTA section, header.

Features:
- Schema-driven editor panel
- Live preview
- Copy code
- Install by registry URL
- Accessibility tests (Playwright + axe + keyboard flows) on every output
- Config persisted in the URL (shareable)

Outputs: React + Tailwind v4; vanilla HTML/CSS/JS.

## Non-goals (MVP)
Accounts, login, database, payments, teams, AI generation, frameworks beyond the two MVP outputs, a hosted runtime, dark-mode variants (post-MVP option), analytics.

## Success criteria
- Every MVP component's outputs pass the same axe + keyboard test suite.
- A developer can go from opening the editor to working code in their project in [TODO: target time — measure with real users].
- [TODO: adoption metrics once there are real users. Do not invent numbers.]

## Components and options
Options marked *(built)* exist in code. Others are a first proposal to refine when each component is built.

### 1. Date picker *(built — feasibility spike)*
Pattern: APG Date Picker Dialog (button → modal dialog → grid).
| Group | Option | Type | Default |
|---|---|---|---|
| Content | Label | text | "Date" |
| Behaviour | Date format | DD/MM/YYYY · MM/DD/YYYY · YYYY/MM/DD · YYYY-MM-DD | DD/MM/YYYY |
| Behaviour | Selection | single · range | single |
| Behaviour | Week starts on | monday · sunday | monday |
| Add-ons | Clear button | boolean | off |
| Add-ons | Today button | boolean | off |
| Add-ons | Helper text + content | boolean + text (shown only when on) | off |
| Style | Accent colour | colour | #2563eb |
| Style | Corner radius | 0–16 px | 6 |
| Style | Size | sm · md · lg | md |

Built-in behaviour: typed input parsed in the chosen format with specific errors (bad format, invalid month, day doesn't exist, end before start); text/focus colour picked automatically for contrast with the accent.
Later: min/max dates, disabled dates, locale for month/day names, form field name / hidden ISO value, dark theme.

### 2. Form with custom validation
Pattern: native form, labels, `aria-describedby` errors, error summary.
- Content: fields list (text, email, phone, textarea, select, checkbox) with label, placeholder, required; submit text; success message.
- Behaviour: validate on blur / on submit; rules per field (required, min/max length, email, pattern preset); custom error text per rule; focus first invalid field on submit.
- Add-ons: error summary with links, character counter, optional-field marker, helper text.
- Style: layout 1/2 columns, spacing, colours, radius, size.

### 3. Searchable select
Pattern: APG combobox with listbox popup.
- Content: label, placeholder, options list (label/value), "no results" text.
- Behaviour: single / multi, filter contains / starts-with, clear on select, max visible items.
- Add-ons: clear button, option groups, helper text, icons per option.
- Style: colours, radius, size.

### 4. Modal / popup
Pattern: APG dialog (modal).
- Content: trigger text, title, body, primary/secondary button text.
- Behaviour: close on backdrop click, initial focus target, return focus (always on), size sm/md/lg/full, position centre / bottom sheet, animation none/fade/scale (respects reduced motion).
- Add-ons: close icon button, footer, scroll-lock.
- Style: colours, radius, backdrop opacity, padding.

### 5. CTA section
Pattern: landmark section with heading; HTML-first, no JS.
- Content: eyebrow, heading, text, primary/secondary button text + href, image + alt.
- Behaviour: heading level (h2–h4), layout centred / split / image left-right.
- Add-ons: secondary button, image, background pattern.
- Style: background, text colours, spacing, max width, alignment.

### 6. Header
Pattern: `<header>` landmark, `<nav>` with disclosure button for mobile menu.
- Content: logo text/image, nav links list, CTA text + href.
- Behaviour: sticky on/off, mobile breakpoint, current-page indicator.
- Add-ons: CTA button, search link, skip link.
- Style: colours, height, spacing, border/shadow.

## After MVP
Footer, mega menu (2- and 3-level, APG disclosure navigation), custom dropdowns, sliders, lazy loading; more frameworks via the Mitosis vs Web Components spike (see DECISIONS).
