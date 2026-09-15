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
