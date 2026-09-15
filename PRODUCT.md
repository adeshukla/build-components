# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Front-end developers and freelancers building client marketing sites and landing pages. They need common UI components (date picker, modal, forms, select, header, CTA) that are accessible and match the client's brand, and they need them fast, without adding a component library to the project.

## Product Purpose
Ready-made, accessible UI components that developers configure visually and take into their own project as plain code: React + Tailwind v4, or HTML/CSS/JS with no library. Success: a developer finds the component, sets content, behaviour, add-ons and style without writing code, sees it working, and leaves with code that passes accessibility tests.

## Positioning
Every exported output, not just the preview, is tested with Playwright + axe (WCAG 2.2 AA) and keyboard-only flows. Delivery never adds a runtime dependency: copy the code, or install it by URL through a shadcn-compatible registry.

## Operating Context
- Used on a desktop browser while building a client site.
- The editor is where the work happens: pick a component → change options → test the live result (both outputs, different widths) → copy code or run the install command.
- Configuration lives in the page URL, so it can be shared.
- Planned for devstash.me as a case study.

## Capabilities and Constraints
- Built: date picker (single/range, typed input in a chosen format, month/year views, min/max dates, form value) and modal (positions, animations, optional buttons).
- Planned MVP components: searchable select, form with validation, header, CTA section. Not built yet.
- Not in MVP: accounts, database, payments, teams, AI generation.
- Stack: Next.js 16 App Router, TypeScript, Tailwind CSS v4, pnpm.

## Brand Commitments
- "Build Components" is the logo for now. "Component Platform" stays the internal working name in docs and repo until Adesh confirms a final name.
- Nothing is registered or published under a name without Adesh's approval.

## Evidence on Hand
- The live, working components themselves.
- What the test suite actually checks: axe WCAG 2.2 AA, keyboard flows, and Chromium/WebKit/iPhone runs.
- Roadmap of the four coming MVP components, shown clearly as coming soon.
- No users, usage numbers, testimonials, benchmarks or logos exist. They must not be invented.

## Product Principles
1. Every option is findable in seconds: organised by what the developer is trying to do.
2. What you test is what you ship: previews run the exported code.
3. Accessible by default, proven by tests, not claimed.
4. The developer owns the output: plain code, no runtime dependency.

## Accessibility & Inclusion
WCAG 2.2 AA for both the app and every exported component. Keyboard-only and screen-reader use are first-class. All motion respects `prefers-reduced-motion`.
