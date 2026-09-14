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
- `registry/<component>/` is the product. Per component:
  - `schema.ts` — options (`as const satisfies Schema`) plus a compile-time check that it matches the component's config type.
  - `react/<name>.tsx`, `vanilla/<name>.{html,css,js}` — real, working source files, each with one `// @config-start … // @config-end` block.
- `lib/export.ts` → `applyConfig(source, config)`: exporting = swapping that block. Used by the editor's Copy, the registry route and the test generator.
- `lib/schema.ts` — option types, `parseConfig` (validates untrusted query params), `toSearchParams`, `isVisible` (dependsOn).
- `components/options-panel.tsx` — editor controls generated from any schema.
- `app/<component>/page.tsx` + `editor.tsx` — editor. Config lives in the URL query (non-default values only).
- `app/r/[name]/route.ts` — shadcn registry item; config from query params.
- `e2e/generate.ts` writes exported outputs to `app/harness/*` (React, rendered by Next) and `e2e/.generated/*` (vanilla, opened via file://). `e2e/*.spec.ts` runs identical tests against both. Both dirs are gitignored.

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
