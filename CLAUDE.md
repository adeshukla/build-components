@AGENTS.md

# Component Platform (working name)

Ready-made, accessible UI components that developers configure visually and take into their own project as plain code — no component library to install.

Owner: Adesh Shukla (UI developer). Future case study on devstash.me. Repo lives at `C:\dev\component-platform` — keep it outside OneDrive.

## Start of every session
1. Read this file and `docs/PROGRESS.md`.
2. Tell Adesh in three lines where things stand and what you'll do next.
3. Before stopping (or pausing mid-task) update `docs/PROGRESS.md`. Log every real choice in `docs/DECISIONS.md`. Keep this file current.

## Decisions (don't reopen without new evidence — full log in docs/DECISIONS.md)
1. Separate project: own repo, own deploy, eventually own subdomain. Not a section of DevStash.
2. Needs its own name. "Component Platform" is a neutral working name. Never register or publish under a name without Adesh's approval.
3. Schema-driven: ONE options schema per component drives the editor panel, URL state, live preview and every exporter.
4. No runtime dependency for users: copy code, or install by URL through a shadcn-compatible registry (`/r/<name>.json`). No hosted render API or embed script.
5. MVP outputs: React + Tailwind v4, and vanilla HTML/CSS/JS.
6. Multi-framework path undecided (Mitosis vs Web Components). Decide with a spike on a complex component. Never list a framework as supported unless its output passes the same tests.
7. Accessible by default: WAI-ARIA APG patterns. Test every generated output (not just the preview) with Playwright + axe + keyboard-only flows.

## How it's built
- `registry/<slug>/` is the product. Per component:
  - `schema.ts` — options (`as const satisfies Schema`) plus a compile-time check against the component's config type.
  - `react/<slug>.tsx` — one `// @config-start … // @config-end` block.
  - `vanilla/<slug>.{css,js}` — plain output. JS-driven parts also ship `<slug>.html`; HTML-first parts (cta, form, header) generate markup from the options in `vanilla/render.ts` instead.
- Every component supports `theme` (light / dark / system, detected at runtime) and, where it matters, `iosOnPhone` (Apple system font, iOS blue, 44px targets, bottom sheets on iPhone/iPad).
- `lib/export.ts` → `applyConfig(source, config)`: swap the config block. Files without one come back unchanged.
- `lib/schema.ts` — option types incl. `list` (repeatable items) and URL-safe `format: "url"`; `parseConfig` validates untrusted query params; `isDefault`, `toSearchParams`, `isVisible`.
- `lib/html.ts` — `escapeHtml`, `safeHref`, `luminance`, `htmlPage` for generated markup.
- `lib/registry.ts` — the one map of slug → title, description, schema. Used by the registry route and the preview page.
- `lib/parts.ts` — catalogue: part name (Almanac, Porthole, Sextant, Logbook, Masthead, Beacon), plain name, pattern, accent, status.
- `components/editor.tsx` — shared editor: test bench, keyboard map, manual checklist, install + code tabs. The React preview runs in a frame pointing at `/preview/<slug>`; options reach it by postMessage.
- `components/preview-client.tsx` — renders the React component for that frame. Add new components here.
- Routes: `app/(site)/…` has the header/footer chrome; `app/(bare)/…` (preview + generated harness) has none, so component dialogs stay inside the frame.
- `app/r/[name]/route.ts` — shadcn registry item for every slug in `lib/registry.ts`.
- Tests:
  - `e2e/generate.ts` holds the `components` map (schema, variants, optional `renderHtml`). Writes React output to `app/(bare)/harness/<slug>-<variant>` and vanilla output to `e2e/.generated/<slug>/<variant>`. Both gitignored.
  - `e2e/helpers.ts`: `targets(slug)`, `expectNoAxeViolations`, and `open(page, url)` which waits for `data-hydrated` on React harness pages.
- Adding a component touches: `registry/<slug>/`, `app/(site)/<slug>/`, `lib/parts.ts`, `lib/registry.ts`, `components/preview-client.tsx`, `components` in `e2e/generate.ts`, `e2e/<slug>.spec.ts`.

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
- The registry route reads `registry/` with `fs` at request time. On Vercel this may need `outputFileTracingIncludes` — not verified yet.
- Config JSON is escaped (`<` → `\u003c`) because the vanilla JS gets inlined into the preview iframe's `<script>`.
- PowerShell shows pnpm's `$ cmd` echo as a red NativeCommandError. That is not a failure — check the exit code.
- Next injects `#__next-route-announcer__` with `role="alert"` on every page. Scope test locators to `main`.
- After `pnpm test:e2e`, the generated `app/harness/*` routes show up in local `next build` output. They `notFound()` in production and are gitignored.
- React components: render date- or locale-dependent content only on the client (e.g. only while a popup is open), or hydration will mismatch.
- Only one `next dev` can run per project (lock in `.next/dev`). If Adesh's `pnpm dev` is already running on :3000, run tests with `E2E_PORT=3000` so Playwright reuses it. Never kill his server.
- Tests run in 3 Playwright projects: chromium, webkit (Safari engine) and iphone (emulated iPhone 15). Playwright's WebKit is close to Safari but not identical; a real-device check stays on the manual checklist.
- Playwright refuses to click `aria-disabled` elements. Use `click({ force: true })` when testing that a disabled item can't be picked.
- ESLint enforces `react-hooks/set-state-in-effect`. Read browser storage with `useSyncExternalStore` (see the checklist in `components/editor.tsx`), not `setState` inside `useEffect`.
- Next injects `#__next-route-announcer__` with `role="alert"`: scope alert locators by name or to `main`.
- Safari does not focus a button when it is clicked. Components that close on Escape must listen on `document`, not on their own root (this bit the header menu).
- Safari only Tabs to links when the user turns that setting on. Test link focus with `.focus()`, not with Tab.
- Tests must wait for hydration before typing into React output: use `open()` from `e2e/helpers.ts`.
- Any accent used as *text* has to be darkened/lightened first (`readableAccent`), or WCAG contrast fails. iOS blue on white is only 3.9:1.
