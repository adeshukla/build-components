# Decisions log

Newest at the bottom. Each entry: decision, why, alternatives rejected. Add one whenever a real choice is made.

---

## 2026-09-15 — D1. Separate project, not part of DevStash
**Decision:** Own repo, own deploy, eventually its own subdomain (the Praxis pattern).
**Why:** DevStash is a mostly-static content site with a strict performance budget; this is an app.
**Rejected:** A section inside devstash.me.

## 2026-09-15 — D2. Distinct name; neutral working name until chosen
**Decision:** Working name "Component Platform" (repo `component-platform`). Final name is Adesh's call; nothing is registered or published under a name without approval.
**Why:** "DevStash" is already used by 6+ unrelated products.
**Rejected:** Reusing the DevStash brand.

## 2026-09-15 — D3. Schema-driven architecture
**Decision:** Each component has ONE options schema (type, default, allowed values, dependencies). The editor panel is generated from it, the preview renders from the same config, every exporter reads the same config.
**Why:** One source of truth; no hand-maintained copy per output.
**Rejected:** Hand-built editor panels per component.

## 2026-09-15 — D4. Delivery without a runtime dependency
**Decision:** Copy code, and install by URL through a shadcn-compatible registry endpoint.
**Why:** Users own the code and control it.
**Rejected:** Hosted render API or embed script (a dependency users can't control).

## 2026-09-15 — D5. MVP outputs
**Decision:** React + Tailwind, and vanilla HTML/CSS/JS with no library. Other frameworks only after the MVP is actually used.

## 2026-09-15 — D6. Multi-framework path deliberately undecided
**Decision:** Candidates are Mitosis and Web Components. Decide with a spike on a complex component, not from docs. A framework is only "supported" if its output passes the same tests.

## 2026-09-15 — D7. Accessible by default
**Decision:** Follow WAI-ARIA APG patterns (combobox, dialog, grid, disclosure/menu). Test every generated output with Playwright + axe + keyboard-only flows.

---

Decisions made during the first session:

## 2026-09-15 — D8. Repo location and tooling
**Decision:** `C:\dev\component-platform`, Next.js 16.3.5 via create-next-app, pnpm, git on `dev`. Turbopack stays the default (as shipped); switch to `--webpack` only if it crashes.
**Why:** OneDrive sync has caused stale `.next` failures in DevStash.

## 2026-09-15 — D9. Export = real source file + replaceable config block
**Decision:** Each output is a real, working source file (`registry/<name>/react/*.tsx`, `registry/<name>/vanilla/*.js`) with a single `// @config-start … // @config-end` block. `applyConfig()` swaps that block for the user's config. The editor preview imports the same React file.
**Why:** The code users get is the code that is type-checked, linted and tested. No template strings to drift from the preview. One generic exporter for all components.
**Rejected:** Code generation from string templates (untestable until generated, easy to drift); AST-based codegen (overkill now); Mitosis at this stage (see D6 — undecided).
**Cost:** Behaviour is still written twice (React and vanilla). Only the config is single-source. See PROGRESS feasibility report.

## 2026-09-15 — D10. Add-ons are runtime conditionals in the exported code
**Decision:** A disabled add-on stays in the exported code as a branch controlled by the config object (e.g. `config.clearButton && …`).
**Why:** One code path to test per output, not one per combination of options. Users can switch an add-on on later by editing one value.
**Rejected:** Stripping unused code per config (needs codegen or AST work; combinatorial testing).
**Revisit if:** Output size or readability becomes a real complaint.

## 2026-09-15 — D11. Vanilla date picker renders its own markup from JS
**Decision:** `<div data-date-picker></div>` + script builds the field and dialog.
**Why:** The single config block drives all text and add-ons; no HTML templating step.
**Ceiling:** Without JS nothing renders. For HTML-first components (CTA, header, form) the vanilla output should be real HTML enhanced by JS — decide per component.

## 2026-09-15 — D12. Native `<dialog>` + `showModal()` for popups
**Decision:** Calendar popup uses the native modal dialog: top layer, inert page behind it, built-in Escape.
**Rejected:** Portal + focus-trap libraries (dependency; more code).
**Note:** Tab wrapping inside the dialog is still hand-written, so focus can't reach browser UI.

## 2026-09-15 — D13. No Zod for option validation (for now)
**Decision:** `lib/schema.ts` has a ~30-line `parseConfig` that validates query params against the schema (allowed select values, hex colours, clamped numbers, max text length).
**Why:** Flat options don't need a validation library.
**Revisit when:** Options need lists or nested objects (header nav links, form fields). Zod v4 is the likely choice then.

## 2026-09-15 — D14. Tests run against exported files, not the editor preview
**Decision:** `e2e/generate.ts` runs the real exporter for each test variant. React output is written into a generated Next route (`app/harness/…`); vanilla output is written as static files opened via `file://`. One spec runs identically against both.
**Rejected:** Testing the in-app preview (not what users get); Playwright component testing (experimental, extra bundler).

## 2026-09-15 — D15. Config persisted in the URL only
**Decision:** Non-default option values go into the query string (shareable); the registry URL uses the same query string.
**Rejected (for now):** localStorage — adds a second state source and unclear precedence with shared links.

---

Session 2 (Adesh: "complete the next phases that don't need me, and get a UI ready to test the components"):

## 2026-09-15 — D16. One shared editor, doubling as the test UI
**Decision:** `components/editor.tsx` is used by every component page. It adds:
- A live test for both outputs. React renders inside a test form; HTML/CSS/JS runs the exported files inside a sandboxed iframe with a test form.
- Preview width switcher (phone 375 / tablet 768 / full).
- "Submit test form", which shows the real submitted values.
- A per-component manual checklist (screen reader, zoom, reduced motion). Ticks are stored per browser in localStorage.

**Why:** Adesh asked for a UI to test components. Two components now share the editor, so the abstraction has two uses.
**Rejected:** A separate "playground" app (a second UI to maintain); hosting Storybook (a dependency and a different view from what users get).

## 2026-09-15 — D17. `date` option type; dates in config are ISO strings
**Decision:** The schema gains `type: "date"` (value "YYYY-MM-DD" or "" for none), rendered as `<input type="date">`. Form values from the date picker are also ISO, whatever the display format.
**Why:** Min/max dates need it. ISO is unambiguous for servers.

## 2026-09-15 — D18. Modal built by hand (React + vanilla) before the D6 framework decision
**Decision:** Build the modal the same way as the date picker while the Mitosis / Web Components question waits for Adesh.
**Why:** The modal is small, reuses the proven native `<dialog>` approach, and gives Adesh a second component to test. Its tests target exported output, so they keep their value whatever D6 decides.
**Not done by hand yet:** Searchable select, form, header, CTA. Their cost depends on D6 and on the `list` option type.

---

Session 3 (Adesh: "the design is ugly … super organized … Build Components logo … full of animations and a unique theme"; date picker month/year; iPhone/Safari question; remove the test form):

## 2026-09-16 — D19. Visual world: "Parts Datasheet"
**Decision:** Components are presented as electronic parts: solder-mask purple board with gold contact pads and silkscreen labels for identity (header, footer, home hero), white datasheet paper for the work (catalogue, editor, code). Barlow Condensed display, Geist body, Geist Mono only for part numbers, data and code. Recorded in `DESIGN.md`.
**Why:** The impeccable concept roll assigned it (seed `e9db4b6a`) from a grounded list of seven worlds. Adesh asked me to decide. It maps onto the product: part number, pinout = keyboard map, test report, order code = install command.
**Rejected:**
- DevTools Inspector: familiar, close to every dev tool.
- Live Code Floor and Event Display: competitive alternates, weaker for finding options fast.
- Four declined outside styles, which donated specific disciplines: the type-mass headline, the PASS stamp, per-part records, and stillness at rest.
- The category-standard docs site.

## 2026-09-16 — D20. Editor organisation
**Decision:**
- **Options panel:** one tab per group (Content / Behaviour / Add-ons / Style) with changed counts, a search across every option, add-ons as switches, a one-line description under every control, and per-option plus reset-all.
- **Right side:** a test bench (output + screen width), a keyboard map, and a manual checklist.
- **Take it home:** install command plus file tabs, with changed config lines flashing gold.

"Submit test form" removed (Adesh found it confusing; form values are covered by e2e tests).
**Why:** Adesh asked for every add-on and feature to be findable without hunting.

## 2026-09-16 — D21. Date picker month and year views
**Decision:** The month-year heading is a button. Days → years (12-year pages) → months → days. Arrow keys move in every view; Escape steps back to days before it closes the dialog. Both outputs.
**Why:** Changing year one month at a time wasn't usable (Adesh's report).

## 2026-09-16 — D22. Test in WebKit and an emulated iPhone
**Decision:** Playwright runs every spec in chromium, webkit (Safari's engine) and an emulated iPhone 15.
**Why:** Adesh asked whether it looks the same on iPhone/Safari. The picker is custom (never the OS picker), so layout is ours; the test run proves behaviour. A real device check stays on the manual checklist.
**Found:** A real React bug. Pressing Enter right after typing skipped validation in WebKit. Fixed by reading the live input value.

---

Session 4 (Adesh: cursor bug, React preview escaping its box, nav/footer, light/dark, per-page animation, better naming, iPhone look, and the rest of the components):

## 2026-09-18 — D23. Parts have names, not codes
**Decision:** "BC-DP01" is gone. Each part has a name from one family (ship's instruments) plus its plain description: Almanac (date picker), Porthole (modal), Sextant (searchable select), Logbook (form), Masthead (site header), Beacon (CTA section). Each also has its own accent colour in the catalogue and on its page.
**Why:** Adesh: the code names were dry and forgettable. Names are easier to say, to search for and to remember; the plain description still carries the meaning.

## 2026-09-18 — D24. The React preview runs in its own frame
**Decision:** `app/(bare)/preview/[slug]` renders just the component. The editor shows it in an iframe and sends options by `postMessage`. Routes are split into `(site)` (with chrome) and `(bare)` (without).
**Why:** A native `<dialog>` opened with `showModal()` always covers the whole window, so the React preview spilled over the page while the HTML/CSS/JS preview (already in an iframe) stayed put. Same containment for both outputs now, and the preview page also proves the exported React file runs standalone.
**Rejected:** Rendering dialogs inline instead of `showModal()` — that would weaken the real component (top layer, page made inert, Escape handling).

## 2026-09-18 — D25. Light / dark / system, per component and for the site
**Decision:** The site has a System / Light / Dark control in the header (saved per browser, applied before first paint). Every component gets a `theme` option with the same three values, resolved at runtime from `prefers-color-scheme`, so exported code follows the visitor's device without any wiring.
**Why:** Adesh asked for both. Components carry their own palette as CSS custom properties, so the exported file works on any site.

## 2026-09-18 — D26. iPhone look, switched on by default
**Decision:** `iosOnPhone` on the date picker, modal and select. On iPhone/iPad it switches to Apple's system font, iOS blue, 44px rows, 12–14px radii, grouped grey fields, and presents the calendar and modal as sheets that slide up from the bottom.
**Why:** Adesh: on iPhone it should feel like what iPhone users already know. Detected from the user agent plus a phone-width media query, so a desktop Safari window is unaffected.
**Cost:** Any accent used as text needs a contrast-corrected shade (`readableAccent`); plain iOS blue on white is 3.9:1 and failed our own axe run.

## 2026-09-18 — D27. HTML-first components generate their markup
**Decision:** The CTA, form and header produce their vanilla HTML from the options (`registry/<slug>/vanilla/render.ts`) instead of shipping a fixed file with a config block. The CTA ships no JavaScript at all.
**Why:** This was the open question from the session-1 feasibility report (D9): swapping a config block works for JS-driven components, not for markup that must be right in the HTML itself. Generating the markup keeps "no JavaScript" honest for content sections.

## 2026-09-18 — D28. Nav and footer stay short
**Decision:** The header links to Catalogue, How it works and Testing; the footer carries the brand, one catalogue link and what the tests cover. Neither lists components.
**Why:** Adesh: the catalogue already lists everything, so repeating it twice is noise.

## 2026-09-18 — D29. Two more parts: Compass (tabs) and Keel (footer)
**Decision:** Added the two components from Adesh's own shortlist that pay off first: **Compass**, tabs following the APG Tabs pattern (roving tabindex, arrow keys, Home/End, automatic or manual activation, horizontal or vertical), and **Keel**, a site footer that ships as plain HTML with no JavaScript.
**Why:** Tabs are the most-asked-for interactive pattern left and are easy to get wrong by hand; the footer completes the pair with Masthead and costs almost nothing because it needs no script. Mega menu, tooltip, slider and lazy loading are still waiting on Adesh to say which comes next.
**How they are built:** Both are HTML-first (D27) — the markup is generated from the options; tabs add a small script for the keyboard only, so the first panel is already open without JavaScript.
**Tests:** Both run the same suite against both outputs in Chromium, WebKit and an emulated iPhone. The tabs spec covers wrapping, Home/End, manual activation and that the panel itself can take focus; the footer spec asserts that a `javascript:` link from a shared URL is neutralised.
