# Progress

Last updated: 2026-09-15 (end of session 2)

## Current status (session 2)

### How Adesh can test the components
```
cd C:\dev\component-platform
pnpm dev
```
Open http://localhost:3000 and pick **Date picker** or **Modal**. On each page:
1. Change options on the left. The live test updates and the URL keeps the config, so links are shareable.
2. Switch **Output** between React + Tailwind and HTML/CSS/JS. Both run the exported code.
3. Switch **Preview width**: phone 375, tablet 768, full.
4. **Submit test form** (date picker) shows the real submitted values. The modal shows "Closed with: primary / secondary / dismiss".
5. Work through the **Manual test checklist** (screen reader, zoom, reduced motion). Ticks are saved in your browser.

### Done in session 2 (2026-09-15)
- **Test UI.** `components/editor.tsx` is shared by every component page:
  - live test of both outputs, React and sandboxed HTML/CSS/JS
  - width switcher
  - test form with submitted values
  - manual checklist
  - copy code and install command

  Also: site header, and a home page with how-to-test steps.
- **Date picker follow-ups** (both outputs):
  - Form field name with hidden ISO values (`date`, or `<name>-start` / `<name>-end`).
  - Earliest/latest dates: outside days are `aria-disabled`, and typed dates get "Choose a date on or after …".
  - The popup follows scroll and resize.
  - New schema option type `date` (D17).
- **Modal** as the second component (D18):
  - 14 options; React + vanilla exports.
  - `/r/modal.json`, and the `/modal` page.
  - 6 tests per output plus a registry test.
- **Registry route** serves every known slug; unknown names return 404 before touching the file system.
- **Checks:** 22/22 e2e tests pass (date picker 5 per output + registry; modal 6 per output + registry). `typecheck`, `lint` and `build` pass.
- **Real component bugs the tests caught** (now fixed and asserted):
  1. The React modal rendered in the top-left corner instead of centred. Tailwind's reset (`margin: 0`) cancels the browser's `<dialog>` centring; plain CSS keeps it, so vanilla was fine. This is exactly the kind of drift the "test every output" rule exists for.
  2. Clicking the modal backdrop moved keyboard focus out of the dialog (both outputs), so Enter stopped working. Backdrop mousedown no longer steals focus.
- **Test-only fixes:** Playwright won't click `aria-disabled` cells (now a forced click). axe was measuring mid-fade (the helper now waits for animations to finish).

### In progress
Nothing half-finished. Everything above is committed on `dev`.

### Next — doesn't need Adesh
- Configurable UI strings (button labels, error messages) for both components.
- Modal: close animation; open from any existing button (custom trigger).
- Check the editor itself at phone width on a real device.

### Next — needs Adesh's answers first
- Components 3–6 (searchable select, form, header, CTA). They depend on question 2 (framework spike vs by hand) and need a `list` option type.

### Blockers & questions for Adesh
1. **Name**: see the options under "Session 1 record" below.
2. **Build order**: Mitosis / Web Components spike next, or build the searchable select by hand?
3. **Tailwind v4 only** for the React output?
4. **Private GitHub repo?** Still no remote: no backup, no CI.
5. **Dark theme and i18n**: MVP or later?
6. **New:** run the manual checklist on both components with NVDA. Automated tests can't judge what a screen reader actually says. Tell me anything that feels wrong.

---

## Session 1 record (history — the "Next" and "Blockers" lists here are superseded by the section above)

## Done
- **2026-09-15** Repo created at `C:\dev\component-platform` (outside OneDrive), git on `dev`, Next.js 16.3.5 scaffold. Commits: scaffold → docs → spike.
- **2026-09-15** `CLAUDE.md`, `docs/PRD.md`, `docs/DECISIONS.md` (D1–D15), this file.
- **2026-09-15** Date picker feasibility spike, end to end:
  - Schema (`registry/date-picker/schema.ts`) → generated editor panel (`components/options-panel.tsx`) → live preview → Copy code.
  - React + Tailwind export and vanilla HTML/CSS/JS export, both from `applyConfig()`.
  - Config stored in the URL; the same query string configures the registry URL.
  - Registry route `/r/date-picker.json?…`.
  - Playwright + axe + keyboard tests running against **both exported outputs**: 11/11 passing.
  - `pnpm typecheck`, `pnpm lint` and `pnpm build` all pass.
- **2026-09-15** Real install smoke test: in a fresh Next.js app with `shadcn@4.21.0 init`, running `shadcn add "http://localhost:3100/r/date-picker.json?mode=range&format=YYYY-MM-DD&clearButton=true"` wrote `components/date-picker.tsx` with that config, and the project typechecks (tsc exit 0). The throwaway project lived in the session scratchpad and is not in this repo.

## In progress
Nothing half-finished. The spike is complete and committed.

## Next
1. Adesh reviews the spike and this report, and answers the questions below (name especially).
2. Decide how to build the remaining five (see "Biggest open question"). Recommendation: a timeboxed Mitosis vs Web Components spike on the **searchable select** before building more components twice by hand.
3. Add a `list` option type to the schema (item sub-schema; editor add/remove/reorder). Header nav links, form fields and select options all need it. This is the point to revisit Zod (D13).
4. Date picker follow-ups:
   - Reposition or close the popup on scroll/resize.
   - `name` + hidden ISO value for forms.
   - min/max and disabled dates.
   - UI strings as options.
   - Manual NVDA check on Windows.
5. Design pass on the editor UI (currently plain and functional); check it at phone width.
6. Before any deploy (needs Adesh's go): verify the registry route's `fs` reads survive Vercel file tracing (`outputFileTracingIncludes`).

## Blockers & questions for Adesh
1. **Name.** Pick one of these, or suggest your own. Only a quick web search was done: no domain, npm, GitHub-org or trademark checks.
   - **Setpiece** — a set piece is prepared in advance and dropped into place. No dev-tool collision found.
   - **Knobwork** — the product is turning knobs instead of writing code. No product found with this name.
   - **Ownkit** — states the core promise: you own the code. Only a small personal iOS repo uses it.
   - **Handcut** — components cut to fit your project. No dev-tool hit found.
   - **Cutwork** — cut a component out and keep it. No dev-tool hit, but it's an embroidery term, so expect search noise.
   - Rejected: TuneKit/TunesKit (already used by iOS repair software, an LLM fine-tuning tool and an iOS library).
2. **Build order.** OK to run the Mitosis vs Web Components spike next, before components 2–6? Otherwise I'll build the searchable select by hand in React + vanilla, like the date picker.
3. **Tailwind v4 only** for the React output (it uses `bg-(--var)` syntax)? Tailwind v3 projects would get broken styles.
4. **GitHub remote.** Should I create a *private* GitHub repo? There is no remote yet, so no backup and no CI.
5. **Dark theme and i18n** for components: MVP or later? UI strings are English; month and day names follow the browser locale.

---

## Feasibility report — date picker spike (2026-09-15)

### Verdict
The architecture holds for config, editor, delivery and testing. One cost is real and unsolved: **behaviour is written once per output.** The schema makes *configuration* single-source. It does not make *code* single-source.

### What worked
- **Schema → editor.** One generic `OptionsPanel` renders 5 option types (text, boolean, select, colour, number), grouped, with `dependsOn` (helper text content only appears when helper text is on). No date-picker-specific editor code.
- **Schema ↔ component type safety.** `schema.ts` has a compile-time check. If an option is added to the schema but not to the component's `DatePickerConfig` type (or the other way round), `tsc` fails.
- **One exporter for every output.** Exporting = swapping the `// @config-start … // @config-end` block in a real source file (D9). The code users copy is the same file that is typechecked, linted, tested and shown in the preview.
- **React + Tailwind without touching the user's Tailwind setup.** Config colours and radius become CSS variables on the root element, and classes like `bg-(--dp-accent)` read them. Confirmed in the generated CSS (`background-color: var(--dp-accent)` etc.).
- **Accessible by default** (WAI-ARIA APG Date Picker Dialog: button → native modal `<dialog>` → `role="grid"`):
  - Roving tabindex; arrows, Home/End, PageUp/PageDown, Shift+PageUp/PageDown.
  - Enter/Space selects; Escape closes; focus returns to the button; Tab wraps inside the dialog.
  - `aria-selected`, `aria-current="date"`, and error text wired through `aria-describedby`.
  - Text colour on the accent and the focus-ring colour are picked from the accent's WCAG luminance, so a light accent colour can't produce unreadable selected dates.
- **Accurate validation messages** in the chosen format, for example:
  - "Day 31 doesn't exist — that month has 28 days."
  - "13 isn't a valid month. Use 01 to 12."
  - "Enter the date as DD/MM/YYYY."
  - "The end date is before the start date."
- **Tests on exported output, not the preview** (D14). `e2e/generate.ts` runs the real exporter for 2 configs:
  - *default*: DD/MM/YYYY, single, Monday start, no add-ons.
  - *range*: YYYY-MM-DD, range, Sunday start, clear + today + helper text.

  React output renders in a generated Next route; vanilla output is opened from disk via `file://`. The **same 5 tests** run against each output:
  - axe (WCAG 2.0/2.1/2.2 A+AA), closed and open, both configs.
  - Full keyboard-only flow.
  - Tab wrap + Escape.
  - Typed input and error messages.
  - Range selection with add-ons.

  A sixth test checks the registry JSON is byte-identical to the exported file and that invalid query values fall back to defaults. First run: 10/11. The one failure was my test selector (Next adds its own `role="alert"` route announcer), not the component. After the fix: 11/11.
- **Registry install** works with the real shadcn CLI (see Done). Config travels in the query string.
- Turbopack didn't crash this session (dev, tests, production build).

### Harder than expected / weaknesses (plainly)
1. **Behaviour duplication.** `react/date-picker.tsx` (420 lines) and `vanilla/date-picker.js` (317 lines, plus 137 lines of CSS) implement the same date maths, parsing, keyboard handling and ARIA separately. Only the shared test suite keeps them equal. Six components × 2 outputs = 12 hand-written implementations, and every future framework multiplies that. This is the main argument for running the D6 spike early.
2. **HTML-first components don't fit the config-block swap as neatly.** The date picker's vanilla version builds its markup in JS (D11). CTA, header and form should ship real HTML that works without JS, so their HTML must be *generated from config* (e.g. a nav links list). That needs a per-component HTML render step, not just a config swap. One option to evaluate: render the React component to static markup at export time.
3. **UI strings aren't configurable yet.** "Choose date", "Now choose the end date." and the error messages are hardcoded in both files. Month/day names follow the browser locale, so a non-English browser shows mixed languages.
4. **axe passing ≠ proven accessible.** Not tested with a real screen reader (NVDA/JAWS/VoiceOver). Not checked by tests: whether live-region announcements are useful, focus-ring contrast (handled in code, not asserted), and touch/mobile behaviour.
5. **Popup positioning is basic.** Position is computed once on open and flips above the field if there's no room below. It does not follow scroll or resize.
6. **Exported code isn't minimal** (D10). Disabled add-ons stay as branches, and the config object uses JSON style (quoted keys).
7. **React hydration constraint.** Dialog contents render only while open, so server and client never disagree about "today" or locale. Fine, but future components must follow the same rule.
8. **Not form-ready.** No `name` or hidden value; no min/max/disabled dates.
9. **Registry item doesn't declare requirements.** Tailwind v4 is needed but not stated. Vercel file tracing for the route's `fs` reads is unverified.
10. **Harness routes in local builds.** After `pnpm test:e2e`, local `next build` output lists `/harness/*`. They return 404 in production and are gitignored, so clean clones and CI never have them.

### Does it hold for the other five?
| Component | Schema/editor | Export approach | Notes |
|---|---|---|---|
| Searchable select | ✅ needs `list` option type | Config-block swap, same as date picker | JS-heavy; duplication cost applies |
| Modal / popup | ✅ | Config-block swap | Reuses the native `<dialog>` approach |
| Form with validation | ✅ needs `list` (fields) + per-field rules | Swap for behaviour + HTML generation for fields | Most complex schema |
| CTA section | ✅ | HTML generated from config + CSS | Little or no JS; weakness 2 applies |
| Header | ✅ needs `list` (nav links) | HTML generated from config + small JS (mobile menu) | Weakness 2 applies |

## How to verify
```
pnpm typecheck && pnpm lint && pnpm test:e2e && pnpm build
pnpm dev   # then open http://localhost:3000/date-picker
```
