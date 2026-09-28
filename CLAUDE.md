@AGENTS.md

# Build Components

Ready-made, accessible UI components that developers configure visually and take into their own project as plain code — no component library to install.

Owner: Adesh Shukla (UI developer). Future case study on devstash.me. Repo lives at `C:\Users\shukl\OneDrive\Desktop\build-components` (moved from `C:\dev\component-platform` on 2026-09-21 at Adesh's request). It is inside OneDrive: if `next dev` shows stale or missing files, pause OneDrive syncing and delete `.next`.

## Start of every session
1. Read this file and `docs/PROGRESS.md`.
2. Tell Adesh in three lines where things stand and what you'll do next.
3. Before stopping (or pausing mid-task) update `docs/PROGRESS.md`. Log every real choice in `docs/DECISIONS.md`. Keep this file current.

## Decisions (don't reopen without new evidence — full log in docs/DECISIONS.md)
1. Separate project: own repo, own deploy, eventually own subdomain. Not a section of DevStash.
2. Name: **Build Components**, at `build-components.devstash.me`, listed as a project on devstash.me (D41). URL, name and author live in `lib/site.ts`.
3. Schema-driven: ONE options schema per component drives the editor panel, URL state, live preview and every exporter.
4. No runtime dependency for users: copy code, or install by URL through a shadcn-compatible registry (`/r/<name>.json`). No hosted render API or embed script.
5. MVP outputs: React + Tailwind v4, and vanilla HTML/CSS/JS.
6. Multi-framework path undecided (Mitosis vs Web Components). Decide with a spike on a complex component. Never list a framework as supported unless its output passes the same tests.
7. Accessible by default: WAI-ARIA APG patterns. Test every generated output (not just the preview) with Playwright + axe + keyboard-only flows.

## How it's built
- `registry/<slug>/` is the product. Per component:
  - `schema.ts` — options (`as const satisfies Schema`) plus a compile-time check against the component's config type.
  - `react/<slug>.tsx` — one `// @config-start … // @config-end` block.
  - `vanilla/<slug>.{css,js}` — plain output. JS-driven parts also ship `<slug>.html`; HTML-first parts (cta, form, header, footer, tabs, mega-menu, carousel, cart) generate markup from the options in `vanilla/render.ts` instead.
- Every component supports `theme` (light / dark / system, detected at runtime) and, where it matters, `iosOnPhone` (Apple system font, iOS blue, 44px targets, bottom sheets on iPhone/iPad).
- `lib/export.ts` → `applyConfig(source, config)`: swap the config block. Files without one come back unchanged.
- `lib/schema.ts` — option types incl. `list` (repeatable items) and URL-safe `format: "url"`; `parseConfig` validates untrusted query params; `isDefault`, `toSearchParams`, `isVisible`.
- `lib/html.ts` — `escapeHtml`, `safeHref`, `luminance`, `htmlPage` for generated markup.
- `lib/registry.ts` — the one map of slug → title, description, schema. Used by the registry route and the preview page.
- `lib/parts.ts` — catalogue: the part's plain name (the one a developer would search for), summary, pattern, accent, status and `category` (drives the catalogue filters). The old ship-themed codenames were dropped on 2026-09-27: nobody could tell what a "Binnacle" was.
- `components/editor.tsx` — shared editor: test bench, keyboard map, manual checklist, install + code tabs. The React preview runs in a frame pointing at `/preview/<slug>`; options reach it by postMessage.
- `components/preview-client.tsx` — renders the React component for that frame. Add new components here.
- Routes: `app/(site)/…` has the header/footer chrome; `app/(bare)/…` (preview + generated harness) has none, so component dialogs stay inside the frame.
- Site pages beyond the home page and the part pages: `/parts` (the whole catalogue, search and filter in the address bar), `/in-use` (three screens composed from real parts, with an X-ray that names each one), `/tested` (the test regime, plus a tab-order tracer and the contrast correction running), `/start` (how to take a part). `e2e/site-pages.spec.ts` covers all four.
- `app/r/[name]/route.ts` — shadcn registry item for every slug in `lib/registry.ts`.
- Tests:
  - `e2e/generate.ts` holds the `components` map (schema, variants, optional `renderHtml`). Writes React output to `app/(bare)/harness/<slug>-<variant>` and vanilla output to `e2e/.generated/<slug>/<variant>`. Both gitignored.
  - `e2e/helpers.ts`: `targets(slug)`, `expectNoAxeViolations`, and `open(page, url)` which waits for `data-hydrated` on React harness pages.
- Adding a component touches: `registry/<slug>/` (schema, docs, react, vanilla), `lib/parts.ts` (with a category), `lib/registry.ts`, `components/preview-client.tsx`, `components` in `e2e/generate.ts`, `e2e/<slug>.spec.ts`. The part page itself is the generic `app/(site)/[slug]/page.tsx`.
- `render.ts` must not import functions from the React file: it is a client module, so the server gets references instead of functions. Duplicate small helpers.

## Stack (installed versions — check before upgrading or coding against a lib)
Next.js 16.3.5 (App Router, Turbopack default) · React 19.2.8 · TypeScript 5.9.3 (strict) · Tailwind CSS 4.3.3 · ESLint 9 + eslint-config-next 16.3.5 · Playwright 1.63.0 + @axe-core/playwright 4.13.0 · pnpm 11.5.0 · Node 24.15.0. Zod not installed (if added: v4 API).

## Commands
`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test:e2e` (starts `next dev` on port 3100; reuses one if running)

## Rules
- No invented data: no fake usage numbers, testimonials, benchmarks or "used by X developers". Use `[TODO: ...]`.
- Don't overengineer: boring, readable code; no abstraction for a single use.
- Ask Adesh before anything irreversible or public: final name, domain, making the repo public, production deploys.
- Git: small, frequent commits on `dev`. Never merge to `main` or deploy unless Adesh says "ship".
- Next 16 differs from training data — read `node_modules/next/dist/docs/` before using an API.

## Gotchas
- Turbopack has crashed on Adesh's machine before. If `next dev` crashes, use `next dev --webpack` (and the same in `playwright.config.ts`).
- Tailwind v4: design tokens go in `@theme` in CSS; there is no `tailwind.config`. The exported React file uses v4-only syntax (`bg-(--dp-accent)`), so users need Tailwind v4.
- Tailwind skips gitignored paths when scanning for classes; harness files work because the same classes exist in `registry/`.
- Part pages and the registry route read `registry/` with `fs` at request time. `outputFileTracingIncludes` in `next.config.ts` ships it; not yet verified on a real Vercel deploy.
- The HTML/CSS/JS preview is a sandboxed srcdoc frame (`allow-scripts allow-forms`, no shared origin): storage throws there, so parts must fall back to memory. `e2e/editor.spec.ts` runs every part in the real editor frames; component specs alone never see sandbox problems.
- Every HTML/CSS/JS stylesheet sets `line-height: 1.5` and a system font on its root, to match what Tailwind's reset gives the React output.
- An error that disappears on blur can move the submit button out from under the pointer mid-click. Once an error shows, re-check the field as the user types.
- Dev server + OneDrive: a newly generated harness route can stay 404 until its page file is touched.
- `next.config.ts` sets a CSP. Adding any external script, font, image or analytics means updating it, or the browser will block the resource.
- Config JSON is escaped (`<` → `\u003c`) because the vanilla JS gets inlined into the preview iframe's `<script>`.
- PowerShell shows pnpm's `$ cmd` echo as a red NativeCommandError. That is not a failure — check the exit code.
- Next injects `#__next-route-announcer__` with `role="alert"` on every page. Scope test locators to `main`.
- After `pnpm test:e2e`, the generated `app/harness/*` routes show up in local `next build` output. They `notFound()` in production and are gitignored.
- React components: render date- or locale-dependent content only on the client (e.g. only while a popup is open), or hydration will mismatch.
- Only one `next dev` can run per project (lock in `.next/dev`). If Adesh's `pnpm dev` is already running on :3000, run tests with `E2E_PORT=3000` so Playwright reuses it. Never kill his server.
- Tests run in 3 Playwright projects: chromium, webkit (Safari engine) and iphone (emulated iPhone 15). Playwright's WebKit is close to Safari but not identical; a real-device check stays on the manual checklist.
- Playwright refuses to click `aria-disabled` elements. Use `click({ force: true })` when testing that a disabled item can't be picked.
- Both preview frames open at `MIN_PREVIEW_HEIGHT` (480px, `components/editor.tsx`) so switching output never moves the page; the React frame grows past it for taller components.
- Money and dates in exported components are formatted by hand, never by locale: `Intl` output differs between the server and the browser and breaks hydration.
- ESLint enforces `react-hooks/set-state-in-effect`. Read browser storage with `useSyncExternalStore` (see the checklist in `components/editor.tsx`), not `setState` inside `useEffect`.
- Next injects `#__next-route-announcer__` with `role="alert"`: scope alert locators by name or to `main`.
- Safari does not focus a button when it is clicked. Components that close on Escape must listen on `document`, not on their own root (this bit the header menu).
- Safari only Tabs to links when the user turns that setting on. Test link focus with `.focus()`, not with Tab.
- Tests must wait for hydration before typing into React output: use `open()` from `e2e/helpers.ts`.
- Any accent used as *text* has to be darkened/lightened first (`readableAccent`), or WCAG contrast fails. iOS blue on white is only 3.9:1.
- Safari does not focus a button when it is clicked, so a dialog must be told which element opened it rather than reading `document.activeElement`; and focus cannot leave a modal dialog that is still open, so close it before moving focus.
- A count spaced with a margin reads as "To do(2)". Put the space in the text.
- Under a full test run the dev server occasionally answers one page with a truncated payload (`Uncaught SyntaxError: Unexpected end of JSON input`, empty frame). It is dev-only: the same suites pass against `next build && next start`. Rerun before believing it.
- Data attributes a vanilla script reads must not collide with attributes on other elements: `root.querySelector("[data-title]")` will happily find a list item before the heading (this bit the wizard). Prefix them.
- A `display` declaration beats `[hidden]`. `.thing { display: flex }` wins over the UA stylesheet's `[hidden] { display: none }`, so a hidden element stays on screen. Tailwind's preflight says `[hidden] { display: none !important }`, so **only the plain-CSS output is affected** — every stylesheet that sets a display now repeats `.x [hidden] { display: none; }`. This has now bitten three components (upload, command menu, hover card).
- Same trap on `<dialog>`: any `display` on the dialog element beats `dialog:not([open]) { display: none }`, and a closed dialog sits on the page. Put the flex or grid on a wrapper **inside** the dialog.
- With `box-sizing: border-box`, padding and `min-height` win over `width: 1px`. A "visually hidden" element that keeps its padding is a 32×44 box. The hidden state has to zero the padding and the min-height too.
- A sticky header that changes its own size produces scroll events that look like scrolling up: shrinking shortens the content above, so the browser nudges `scrollTop` to keep the view still. Require a real move (8px) before reading an event as direction, and measure from the last decisive position, not the last event.
- Never gate a document-level `keydown` listener on component state if anything else in the same component moves focus. Attach it once and check the state inside; two effects racing is how Escape stopped working on the iPhone.
- `requestAnimationFrame` is not "after React has rendered". To focus something that appears with a state change, put the request in a ref and move focus in an effect with no dependency array — it runs after every commit. rAF cost half an hour of WebKit failures in the menu bar.
- `parseConfig` reads an empty list (`[]`) as "not specified" and falls back to the default, so **a list cannot be emptied from a URL**. Use a boolean to hide an optional block (`showTrail`, `showLine2`, `showDetails`).
- A hard-coded element id in a React component breaks the moment two of that part share a page. Use `useId()`. About twenty of the older parts still hard-code theirs — see PROGRESS.
- Playwright cannot click a visually hidden radio or checkbox: its own label covers it. Use `check({ force: true })`, or click the label.
- `aria-hidden` does not excuse an axe colour-contrast failure — contrast is a visual requirement, and axe is right. To show text that deliberately fails, draw it as SVG `<text>`.
- An `animation.finished` promise **rejects** with an AbortError when the animation is replaced or interrupted, which failed the whole wait in `expectNoAxeViolations`. It catches per-animation now: a cancelled animation has settled, which is all the helper wants.
- `role="listbox"` may only own `option` and `group`. A group heading or an empty-state paragraph inside it fails `aria-required-children`, and `aria-label` on a div with no role fails `aria-prohibited-attr`.
