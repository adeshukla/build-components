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

## 2026-09-20 — D30. Three parts that are hard to hand-build: Cargo, Chartroom, Capstan
**Decision:** Added the three Adesh asked for by name: **Cargo** (basket — lines, quantity steppers, removing, delivery with a free-delivery threshold, totals, as a panel or a drawer), **Chartroom** (mega menu — columns of links under each heading, click or hover, Escape and outside click to close) and **Capstan** (carousel — a scroll-snap row with previous/next, dots, a counter and optional rotation).
**Why:** Adesh: the platform should carry the components people find hard to build from scratch, not the easy ones. Each of these has a real trap: money arithmetic and announcements in the basket, focus and overlay behaviour in the mega menu, and rotation that must pause, respect reduced motion and still be usable by keyboard in the carousel.
**How they are built:** All three are HTML-first (D27): the markup and the first totals ship in the HTML, and the script only adds behaviour. The basket's drawer is a native `<dialog>` (D12), so the top layer, the inert page and Escape come from the browser.
**Money:** prices are formatted by hand (`symbol + value.toFixed(2)`), never by locale, so the server and the browser can never disagree and hydrate differently.
**Found by the tests:** the carousel's dots were under the 24px minimum target size (WCAG 2.2 AA), and its last-slide maths ignored how many slides are on screen; the mega menu's panel covered the next row of a wrapped bar on a phone.

## 2026-09-20 — D31. Both outputs open at the same height in the test bench
**Decision:** The React frame and the HTML/CSS/JS frame both start at 480px, and the React frame grows from there for taller components. The preview frame paints its own surface.
**Why:** Adesh: the React box did not match the HTML/JS box. The React frame measured its content, so a short component gave a half-height box and the page jumped when the output was switched.

## 2026-09-20 — D32. The form is field-driven, with the rules as options
**Decision:** The form no longer has five fixed fields. A `fields` list sets the label, type (text, email, tel, url, number, date, textarea, select, checkbox), whether it is required, a minimum and maximum, a custom pattern, the choices for a select and a hint. Checking happens on blur, as you type, or on submit; a field that is already wrong is re-checked as it is corrected whichever you pick.
**Why:** Adesh: "no validation controls are given". Validation worked, but the rules were baked in, so the part could only ever be the contact form we happened to write.
**How:** One rule set, written twice (React and plain JS) and asserted by the same tests. Messages name the problem and the fix, in the style of the GOV.UK Design System.

## 2026-09-20 — D33. One page for every part
**Decision:** Per-component `page.tsx` and `editor.tsx` files are gone. A part page is `app/(site)/[slug]`, and `lib/registry.ts` carries title, description, schema, keyboard map, checklist and HTML renderer for every component.
**Why:** Eleven near-identical file pairs, about to become thirty-five. Adding a component is now four files in `registry/<slug>/` plus one entry.

## 2026-09-20 — D34. What gets built next, and why those
**Decision:** The list is picked on two axes: how often developers reach for it, and how hard it is to get right by hand. First five: accordion, tooltip, dropdown menu, popover and notifications. Then: data table, pagination, breadcrumbs, stepper, sidebar, file upload, multi-select, password field, one-time code, range slider, switch, rating, time picker, skeleton, empty state, alert banner, avatars, pricing table, stats, cookie consent, timeline, lightbox.
**Why:** Adesh asked for the components developers struggle to build from scratch. Accessibility guidance is consistent about which those are: comboboxes and autocompletes, dates, tables, trees and drag-and-drop are the hard ones, and menus, tooltips and live-region messages are the ones people get subtly wrong.
**Grounding:** The A11Y Project's guide to troublesome components, Adam Silver on accessible autocompletes, and the published component sets of Radix, Base UI and shadcn (what they carry is a fair proxy for what people use).

## 2026-09-20 — D35. Hover-pause only where hovering exists
**Decision:** A message that clears itself pauses on hover only on devices that really hover (`(hover: hover)`); focus always pauses it.
**Why:** The iPhone test run caught it: a message that appears where the finger tapped keeps an emulated hover, so it would never clear itself on a phone.

## 2026-09-21 — D36. Messages sit under their field, and the summary is opt-in
**Decision:** Each field's error message goes directly under the field, as Bootstrap, Material and Ant do. The error summary at the top of the form is still there, but off by default; turning it on gives the GOV.UK arrangement (summary plus inline messages).
**Why:** Adesh: "in react it shows stack of validation errors … use standard method follows in the industry". With the summary on by default every problem was said twice.
**Also:** the two-column layout now uses CSS subgrid, so labels, inputs and messages line up across columns however long a label or hint runs. That was the misalignment in the screenshots.

## 2026-09-21 — D37. Layout is tested, not just behaviour
**Decision:** `e2e/layout.spec.ts` loads every component, in both outputs, at 375, 768 and 1280, and fails on: the page scrolling sideways, any element running past the right edge that is not inside a scroller or clipped, and any pressable thing under 24px.
**Why:** Adesh: "you are not testing the components and their responsiveness, alignment, accessibility also their usability". Every test so far proved behaviour; none of them looked at the result. The first run found seven real problems.
**Found by it:** vanilla exports with no `box-sizing` of their own overflowed any page without a CSS reset (the form ran off the side); footer links, the basket's remove button, the form checkbox, the notification action and the header logo were all under the minimum target size; the searchable select, date picker and modal fell back to Times on a plain HTML page because their font was `inherit`.

## 2026-09-21 — D38. Five navigation and data parts
**Decision:** Manifest (data table), Ladder (pagination), Wake (breadcrumbs), Course (stepper) and Gangway (sidebar navigation).
**Why:** Next on the D34 list, and the table is the one accessibility guidance singles out as hard to get right.
**Notable choices:**
- The table is written as comma-separated lines with the first line naming the columns, so a whole dataset is one field you can paste into. A cell cannot contain a comma; that is the ceiling, and it is noted in the code.
- Money and counts sort by value, not as text: sorted as text, £186.00 comes before £24.50.
- Stacking a table into cards on a phone changes `display`, and **that strips a table of its semantics**. Every role is therefore spelled out in the markup, so a screen reader still reads a table either way.
- Breadcrumbs and the stepper ship with no JavaScript at all.
- The stepper says finished, current and not started in words, because a tick and a colour are not available to everyone.
**Found while building:** a `hidden` attribute loses to a `display` class, so folding a sidebar section away did nothing until the class was conditional too. A brand-new harness route is sometimes not registered by the dev server before the tests reach it, so `open()` now reloads once.

## 2026-09-22 — D39. Five input parts
**Decision:** Hoist (file upload), Trawl (multi-select), Cipher (password field), Semaphore (one-time code) and Fathom (range slider).
**Notable choices:**
- **Upload:** dropping is a shortcut, never the only way in — a real file input does the work, kept off-screen rather than `display:none` so it can still be focused and read out. The accept list is checked again after a drop, because a drop ignores it.
- **Multi-select:** the APG combobox focus model — the caret never leaves the box, and the highlighted option is pointed at with `aria-activedescendant`. Each chosen item is a button named “Remove X”.
- **Password:** the rules are part of the field's description, so they are known before typing; each rule and the strength are said in words, not only ticks and bars. The strength is a hint, never a gate.
- **One-time code:** a labelled group, boxes that name themselves (“Character 3 of 6”), paste fills across the boxes, and only the first box carries `autocomplete="one-time-code"`. A single-field layout is offered too, because it is simpler for screen readers and password managers.
- **Slider:** native range inputs throughout, so the keyboard and the announcements come from the browser. A range is two inputs on one track, with only the thumbs taking the pointer so the top one does not swallow clicks meant for the other.
**Found while building:** in single-file mode the upload counted the old file against the limit, so a new file was refused instead of replacing it; a remove button whose name was built from joined text nodes read “Testing , remove”, so every such button is now named outright.

## 2026-09-22 — D40. A global search that takes any data
**Decision:** Lookout, a ⌘K / Ctrl+K search. You give it JSON — an array, an object, nested as deep as you like — and it walks the whole thing: every object with a title becomes a result, and the titles above it become its breadcrumb. Which key is the title and which fields are searched are options; nothing about the shape is declared up front.
**Why:** Adesh asked for a search you just attach data to.
**How it matches:** every word typed must appear somewhere in the entry (so "accessibility audit" finds one person, not everything about accessibility). A title that starts with the first word ranks first, then titles containing every word, then matches elsewhere.
**How it ships:** the React file carries the data in its config; the HTML version carries it in a JSON script block with "<" escaped, so replacing the data is one edit and needs no build step. Links in the data are checked when followed, so a `javascript:` URL goes nowhere.
**Found while building:** with grouping off, the top of every trail vanished, because it was only ever shown as the group heading; and a highlighted match in the accent colour failed contrast on the tinted active row, so matches are now bold and underlined in the text colour.

## 2026-09-22 — D41. Build Components, at build-components.devstash.me
**Decision:** The product is called Build Components and will live at `build-components.devstash.me`, listed as a project on devstash.me.
**Why:** Adesh named the subdomain himself and asked for the site to be made production-ready under it. This settles decision 2 (the name) and the domain question in CLAUDE.md.
**How it's wired:** `lib/site.ts` holds the URL, name and author once; `NEXT_PUBLIC_SITE_URL` overrides the URL for preview deploys.

## 2026-09-22 — D42. Security headers and a static CSP
**Decision:** A Content-Security-Policy on every route (`'self'` for everything, `frame-ancestors 'self'`, `object-src 'none'`), plus nosniff, a referrer policy, a permissions policy and HSTS. No `X-Powered-By`. Registry items get `Access-Control-Allow-Origin: *` so any tool can fetch them.
**Why not nonces:** Next's bootstrap scripts, the theme script and the HTML/CSS/JS preview (an inline srcdoc frame) are all inline. A nonce CSP would make every page dynamic for no gain while there are no third-party scripts. Revisit if analytics or any external script is added.
**Also:** the design-direction comment that was rendered into every page's HTML is gone. It was internal notes, not product.

## 2026-09-22 — D43. About, Accessibility and 404 pages
**Decision:** Add an About page (why it exists, how it differs from a component library, who makes it), an accessibility statement (target WCAG 2.2 AA, what is tested, known limits, how to report a problem) and a 404 inside the site chrome.
**Why:** A production site listed on devstash.me needs somewhere to say who is behind it and how to report problems. An accessibility statement is expected from a site whose whole claim is accessibility.
**Content rule kept:** no invented numbers or claims. The part count is read from the catalogue, and contact goes through devstash.me rather than an address that does not exist yet.

## 2026-09-22 — D44. The catalogue is a filtered grid, not a list
**Decision:** The home catalogue shows compact cards in a grid (up to four across), filtered by type with native radio buttons. "All" shows the first 8 with a "Show all" toggle. Each part now has a `category` in `lib/parts.ts`.
**Why:** Adesh said the long list made the page too long. At 27 parts the list was about 3,000px; the grid is 924px at 800px wide, and it stays short as parts are added.
**Accessibility:** filters are a labelled group of radios, so arrow keys work and the choice is announced; a polite live region says how many parts are shown. Each card is one link.

## 2026-09-22 — D45. Tier 1: the parts that are hardest to get right
**Decision:** Build next the parts developers most often get wrong: time picker, tree view, sortable list, drawer, cookie consent. Then Tier 2 (card fields, guided tour, feed, lightbox, resizable panels), then quick wins. Pricing table, stats and timeline move down.
**Why:** The catalogue's value is in the accessibility work people cannot easily do themselves; page sections show little of it.
**Notable choices:**
- **Time picker:** an editable combobox rather than spin buttons. Any time in range can be typed, and the list is a shortcut, not a gate.
- **Tree view:** paths instead of nested data in the editor, so the option stays a flat list anyone can edit.
- **Sortable list:** move buttons on by default. WCAG 2.2 (2.5.7) needs a way to reorder without dragging.
- **Drawer:** a native modal dialog, like Porthole, so the page behind is inert without extra code.
- **Cookie consent:** a non-modal region, not a modal; it never takes focus. Accept and Reject are styled identically. It stores the choice and fires an event; blocking scripts until consent is the site's job, and the checklist says so.

## 2026-09-22 — D46. Test every part in the editor's real frames
**Decision:** `e2e/editor.spec.ts` loads every part page, runs both outputs in the frames visitors see (the HTML/CSS/JS one sandboxed), and fails on any console error or a frame shorter than its content. The HTML/CSS/JS frame allows forms (`allow-scripts allow-forms`) but never shares the site's origin.
**Why:** Adesh found the cookie banner could not save in the preview. The component tests load the exported files directly, where forms and storage just work, so a sandbox-only failure was invisible to them.
**Also:** both previews now match: same font (the system stack the HTML/CSS/JS output declares), same padding, same line height (1.5 in every HTML/CSS/JS stylesheet), and the HTML/CSS/JS frame grows with its content through a preview-only height script that is never exported.

## 2026-09-22 — D47. Tier 2 parts
**Decision:** card payment fields, guided tour, load-more feed, lightbox, resizable panels.
**Notable choices:**
- **Card fields:** a UI pattern, not a payment integration. Brands are named in words, never as logos. Errors clear as you type once shown ("reward early"), because clearing on blur moved the Pay button out from under the pointer. The checklist says real card data belongs in the payment provider's hosted fields.
- **Guided tour:** each step is a non-modal dialog that takes focus; Skip and Escape work at every step. Steps whose target is missing are skipped, so the tour never points at nothing.
- **Feed:** the WAI-ARIA feed pattern with a Load more button that stays even in scroll mode, so nobody depends on scrolling. Pressing it moves focus to the first new item; scroll loading never moves focus.
- **Lightbox:** demo pictures are drawn gradients, so nothing is loaded from a third party. Focus returns to the thumbnail of the picture you were on, not the one you opened.
- **Resizable panels:** the APG window splitter: a focusable separator with a value, arrow keys, Home/End and Enter to collapse. The visible line is thin; the grab area is 30px.

## 2026-09-25 — D48. The catalogue shows the real thing, moving
**Decision:** Hovering (or focusing) a catalogue card opens a panel that runs the real exported React output in a frame at `/preview/<slug>?demo=1`, plays a short script of the part being used, and shows one line saying how it works. Both live in `lib/demos.ts`.
**Why:** Adesh asked for an animated preview on every card that shows real usage and explains it. A recording or a screenshot would drift from the code; this cannot, because it is the code.
**How it stays honest:** the script is a list of steps (find, click/type/key) run against the component itself. If a selector stops matching, the step simply does nothing — it can never fake a result.
**Accessibility:** one frame at a time (only the hovered card), the panel is `inert` so the frame is never a focus trap, the same sentence is available to screen readers on the card, and nothing moves when reduced motion is set.

## 2026-09-25 — D49. Batch A: the everyday primitives
**Decision:** Switch, rating, segmented control, alert banner, skeleton, empty state, avatar group, badges. A new **Feedback** category groups the three that report what is happening.
**Notable choices:**
- **Switch:** a real checkbox with `role="switch"`, not a button, so the keyboard and form submission come free. The state is also written in words.
- **Rating:** radio buttons for picking (arrow keys, one Tab stop); a single image with the whole value in its name for showing an average, so it is read once as "4.2 out of 5".
- **Alert banner:** the tone is spoken first ("Warning:"), errors interrupt and others wait their turn, and dismissing moves focus somewhere real.
- **Skeleton:** one polite status saying what is loading; the shapes are hidden from screen readers rather than read as empty boxes.
- **Avatar group:** the "+3" circle names the people it stands for. Tints are picked so the initials keep 4.5:1, and a name always gets the same tint on the server and in the browser.
- **Badges:** the words carry the state; colour and dot only repeat it.

## 2026-09-25 — D50. Batch B: the fields people actually need
**Decision:** Tag input, quantity stepper, currency input, phone input, inline edit, colour picker.
**Notable choices:**
- **Tag input:** tags are a labelled list with a remove button each, not a row of divs; removing one hands focus to the next tag, or back to the field when the last one goes.
- **Currency input:** the typed text stays exactly as typed; a hidden field carries the value the server should read, so nothing is reformatted under the cursor.
- **Phone input:** the country is a real select next to the number, so it is reachable and readable, rather than a flag that only a pointer can change.
- **Inline edit:** the button becomes a field and back; focus follows both ways, and Escape restores the old value.

## 2026-09-25 — D51. Batch C: the awkward ones
**Decision:** Back to top, reading progress, language switcher, filter bar, data grid, kanban board.
**Notable choices:**
- **Reading progress:** the bar is a progressbar with a percentage in words, the contents list marks the current heading with `aria-current`, and the last section becomes current once the page cannot scroll further — otherwise the final heading never is.
- **Data grid:** `aria-sort` on the sorted column, a status line saying what was sorted (the rows move silently otherwise), columns that resize with the arrow keys as well as by dragging (WCAG 2.5.7), and a scrolling wrapper that takes focus so it can be scrolled without a pointer.
- **Kanban:** cards move with buttons that name their destination; dragging is the extra, never the only way. Focus follows the card into its new column and the move is announced with its position.
- **Filter bar:** chips are `aria-pressed` toggles; removing a pill returns focus to the chip it came from.

## 2026-09-25 — D52. Batch D: the guards nobody ships in time
**Decision:** Typed confirmation, session timeout, unsaved changes guard, offline banner, shortcut help.
**Notable choices:**
- **Typed confirmation:** the destructive button is really disabled until the phrase matches exactly, and the hint says what will turn it on.
- **Session timeout:** Escape means stay, never sign out; the clock is `aria-hidden` and the time left is announced at 30, 20, 10 and 5 seconds, which is enough to act on without talking over anyone (WCAG 2.2.1).
- **Unsaved changes:** the dialog only appears while there is something to lose, and Escape keeps editing. `beforeunload` covers closing the tab; the browser writes that wording.
- **Offline banner:** a polite status region rather than an alert, sticky rather than fixed so it keeps its own space, and a retry button because `navigator.onLine` only knows about the network, not about your server.
- **Shortcut help:** `?` opens it from anywhere except inside a field, modifier combinations are left alone, and there is a visible button as well (WCAG 2.1.4).

## 2026-09-25 — D53. Batch E: the sections every product site needs
**Decision:** Pricing table, stats tiles, activity timeline, comment thread, product card.
**Notable choices:**
- **No invented numbers anywhere:** prices, changes and stock are printed exactly as entered. The pricing table works out no discounts; the stats tiles have no made-up percentages.
- **Pricing table:** the billing cycle is a radio group, not a switch, and changing it says which prices are showing, because every price on the page changes at once.
- **Stats tiles:** a description list where the change is written in words, so red and green are never the only difference.
- **Timeline:** an ordered list with real `time` elements; older entries arrive behind a button that says how many, and focus lands on the first of them.
- **Product card:** variants are fieldsets of radios, out of stock is said in words as well as drawn, and Add waits for a pick in every group while a status line says which group is missing.

## 2026-09-25 — D54. Batch F: the fiddly four
**Decision:** Signature pad, countdown, code block, toolbar.
**Notable choices:**
- **Signature pad:** typing the name is a full alternative, not a fallback — a canvas cannot be drawn on with a keyboard, and without it the part fails WCAG 2.1.1 outright.
- **Countdown:** the digits tick every second but are `aria-hidden`; what is announced changes only when the coarse reading does. The time left is worked out in the browser, never rendered on the server where it would already be wrong.
- **Code block:** the clipboard can be refused (a sandboxed frame, no permission), so the fallback selects the code and says which keys to press instead of claiming it copied. Line numbers are decoration and never travel with the text.
- **Toolbar:** the APG toolbar pattern — one tab stop for the whole bar, arrow keys inside it, Home and End to the ends, and the stop following whatever was used last.

## 2026-09-25 — D55. Batch G: the two flows
**Decision:** Booking slots and a multi-step wizard.
**Notable choices:**
- **Booking slots:** one radio group across every day, because picking a time is one choice however many days it spans. Taken slots are disabled and say so, how many are free is said up front, and every announcement carries the day as well as the time.
- **Wizard:** each step moves focus to its own heading — a step is a new page as far as a screen reader is concerned — the position is in the heading text ("Step 2 of 4"), validation happens per step with the message in an alert and focus on the field, and going back keeps every answer.

## 2026-09-25 — D56. Safari, dialogs and focus
**Decision:** Every dialog closes itself before handing focus back, and remembers its opener from the click rather than from `document.activeElement`.
**Why:** Safari does not focus a button when it is clicked, so `document.activeElement` is the body there; and focus cannot leave a modal dialog that is still open, which Safari enforces even when React has already re-rendered. Both bit three of the Batch D parts in WebKit and on the iPhone.

## 2026-09-27 — D57. Parts are named the way developers search for them
**Decision:** The ship-themed codenames (Almanac, Porthole, Binnacle…) are removed from the data model and every page. Each part leads with its plain name; the card's second line is the pattern it follows. Twenty-six plain names were also changed to the industry term people actually search for.
**Why:** Adesh: "not understandable by any developer or layman person". A catalogue is a shop window — the label has to say what the thing is. The codenames were charming to us and useless to everyone else, and they pushed the real name into small grey text.
**Cost:** one field deleted, four display sites and one test title updated. Nothing in the exported components referenced them.

## 2026-09-27 — D58. The catalogue is searched, not scrolled
**Decision:** A search box over name, summary, pattern, category and slug; type filters showing live counts and disabling when empty; "/" to focus the box (never while typing); a polite count; an explicit way out when nothing matches. Preview iframes are lazy.
**Why:** Eighty-four parts. Filters alone still left four rows to read, and people arrive knowing the word for what they want ("dialog", "upload", "color") rather than our category for it.

## 2026-09-27 — D59. Batch H: the four form controls everyone rewrites
**Decision:** Checkbox group, radio cards, textarea with counter, select field.
**Notable choices:**
- **Checkbox group:** an "everything" box carrying the indeterminate state, which is the only checkbox state that cannot be set in markup.
- **Radio cards:** the card is paint around a real radio — one tab stop, arrow keys, form submission, no script. The tick keeps its place in the markup whether it shows or not, so the label's text never changes between outputs.
- **Textarea counter:** the count joins the field's description and is announced only at the warning point and the limit; going over is an error to fix rather than a silent truncation of a pasted sentence.
- **Select field:** a native select on purpose (phone picker, type-ahead, nothing to keep in sync), with optgroups, a real prompt option and an error that takes focus back.

## 2026-09-27 — D60. Batches I and J: content and page sections
**Decision:** FAQ, details list, comparison table; hero, feature grid, how it works, newsletter signup.
**Notable choices:**
- **FAQ** is native `details`/`summary`: opening, the keyboard and find-on-page come free, and Open all sets the state on the elements rather than mirroring it. Structured data is deliberately left to the page, so it can never be out of step with the questions shipped.
- **Comparison table:** yes and no are printed as words; a bare tick is read as a stray character or as nothing at all.
- **Hero:** the eyebrow is a paragraph and the heading level is an option, because a mid-page hero must not be a second h1. The picture panel is drawn in CSS, so the exported file requests nothing.
- **Newsletter:** the address is checked in the component (the browser's bubble cannot be read back), a consent problem moves focus to the box rather than the field, and consent is never pre-ticked.

## 2026-09-27 — D61. The home page performs the idea instead of describing it
**Decision:** The home page keeps the Parts Datasheet world and turns it up: one authored arrival in the hero (traces draw, pads take current, the part is uncovered from its top edge), a new socket section where four real exported components take turns under a WAI-ARIA tablist, and three drawn diagrams for the three steps. Spacing moved to a clamp rhythm. No video, no new dependency — CSS keyframes, SVG and IntersectionObserver only.
**Why:** Adesh asked for spacious, fresh, interactive, with motion graphics. The page already claimed "real, running components as the imagery" and then showed a static stack of three. The reel makes that claim literal and gives visitors something to try before they commit to anything.
**Rules it follows:** one focal moment rather than an entrance on every section; the reel stops on pointer, focus, off-screen and reduced motion; reduced motion gets the finished diagram, not a blank one; every colour comes from the two-theme tokens so the diagrams read on white paper and on ink.
**Rejected:** a video slot (nothing real to play, and a third-party embed would mean a CSP change for no content), and GSAP or Framer Motion (a runtime dependency on the site for choreography the stack already expresses).

## 2026-09-28 — D62. Batch L: the seven remaining input parts
**Decision:** Date range, time range, dual range slider, PIN pad, autosaving field, form error summary, address fields.
**Notable choices:**
- **Date and time ranges** are pairs of native inputs that narrow each other's limits, so the browser's own picker greys out the impossible days rather than refusing them afterwards. A span is said in words ("14 nights, 4 March to 18 March"; "3 hours 30 minutes", never "3:30", which reads as half past three).
- **Dual range slider:** two separate sliders, not two thumbs on one track. Overlapping thumbs need `pointer-events` trickery and are very hard to reach from a keyboard; two sliders each with its own label and form value are reachable by definition. `aria-valuetext` says £320, not 320.
- **PIN pad:** real buttons over one hidden field, typing works as well as tapping, and the live region says "three of four digits entered" — never the digits, because a live region is read out loud in the room. The pad order is fixed, not shuffled: a shuffled pad defeats muscle memory and is far slower for anyone with a motor impairment.
- **Autosaving field:** a polite status, not an alert, because an assertive region would interrupt the very typing it is reporting on. Four states in words, and a failure that keeps the draft.
- **Error summary:** focus moves to the summary rather than the first bad field, so the whole list is read before anything is corrected; each line is a link to its answer, and the message is repeated at the field because the summary is off screen by the time the answer is being changed.
- **Address fields:** autocomplete tokens throughout (WCAG 1.3.5), a postcode field called what that country calls it, and a region field only for countries that have one.

## 2026-09-28 — D63. Batch M: navigation, and four bugs it took to get there
**Decision:** Skip links, anchor navigation, command menu, menu bar, cursor pagination, navigation progress, shrinking sticky header, hover card.
**Notable choices:**
- **Command menu** is a combobox over a grouped listbox: the field keeps focus and `aria-activedescendant` moves. A listbox may only own options and groups of options, so the group heading is a picture of the group's own `aria-label`, and the empty message lives outside the listbox.
- **Menu bar** is the APG menubar in full — one tab stop with a roving tabindex, sideways from an open menu opening the next one, type-ahead.
- **Cursor pagination** has no page numbers, because a cursor finds the end by getting a short page. The ends carry `aria-disabled` rather than `disabled`, so they can still be focused and the reason read.
- **Navigation progress** has no `progressbar` role: the component has no idea what fraction is done, and a progressbar with an invented value is a lie. Nothing is drawn until the load outlasts a delay.
- **Hover card** meets all three parts of WCAG 1.4.13 and holds nothing interactive, because a tooltip may not contain controls. A preview that needs its own buttons is a popover.

**Bugs this batch found, each of which would have shipped:**
1. **A sticky header that shrinks fights itself.** Shrinking shortens the content above it, so the browser nudges the scroll position a few pixels to keep the view still — and read as direction, those nudges say "scrolling up", which brought the header straight back the instant it hid. Only a move of 8px or more counts as direction now.
2. **A `display` declaration beats `[hidden]`.** The command menu's filtered-out options and the whole hover card stayed on screen in the plain output. Tailwind's preflight already says `[hidden] { display: none !important }`, which is why only the plain CSS was wrong; every stylesheet that sets a display now repeats it.
3. **A "hidden" skip link was a 32×44 box.** With `box-sizing: border-box`, padding and a min-height win over `width: 1px`. Both wait for focus now.
4. **The anchor nav marked the wrong section and never the last one.** A line at 35% of the viewport is already above the second heading before anything has been scrolled. The line sits near the top now, following a link marks its section at once, and the bottom of a scrollable page marks the last.

## 2026-09-28 — D64. Batch N: feedback, and the timing rule nobody implements
**Decision:** Bottom sheet, loading button, undo snackbar, inline confirm, circular progress, error state with retry, maintenance notice, help hint.
**Notable choices:**
- **Loading button:** `aria-busy` and `aria-disabled`, never the `disabled` attribute. Disabling the focused button moves focus to the page body, so the place is lost and nothing is announced. The widest of the three labels sets the width, so the button does not move under a pointer.
- **Undo snackbar:** the clock stops while the snackbar is hovered or focused, and nought seconds never runs at all — a time limit that cannot be extended fails WCAG 2.2.1. The words live in a live region of their own, because a region containing a button is read as a lump of text and re-reads itself on every countdown tick.
- **Bottom sheet:** the drag handle is a real button with a name. Dragging is the extra; a keyboard cannot drag, and many hands cannot either.
- **Circular progress:** indeterminate means no `aria-valuenow` at all. Inventing a number, or animating a fake one, is a lie about the state.
- **Error state:** a focusable region, not `role="alert"`. An alert reads the whole panel over whatever else is happening and leaves no way back to it. It says whether anything changed, which is the first thing anyone wants to know and almost no error state answers.
- **Maintenance notice:** a region landmark rather than a live region, because the notice is already there when the page loads, so nothing would be announced.
- **Help hint** is a disclosure, not a tooltip: hovered help cannot be read twice, cannot be copied from, and barely exists on a touch screen.

**Bug found:** `display: flex` on a `<dialog>` beats the browser's own `dialog:not([open]) { display: none }`, so the closed bottom sheet was sitting on the page. The flex column moved into a wrapper inside the dialog, in both outputs.
**Overclaim corrected:** "the row keeps its height in all three states" was only true where there is room. At 390px the question has to wrap below the filename. The claim is now the true one: the thing being acted on never moves, and the row only grows downwards.

## 2026-09-28 — D65. Batches O and P: content and page sections, and two limits in the option system
**Decision:** Changelog, notification list, list with row actions, order tracker, invoice summary, article card, author byline, image gallery, click-to-load video, pull quote, team grid, logo wall; page header, split feature, stat comparison.
**Notable choices:**
- **Per-row actions are named with their row.** "Delete Churn by cohort", not "Delete" nine times, which is exactly what a screen reader would otherwise list.
- **Invoice totals are worked out in whole pennies.** In floating point 0.1 + 0.2 is 0.30000000000000004, which is how an invoice ends up a penny out.
- **Click-to-load video** requests nothing from the host until the button is pressed — no script, no cookie, no frame — and the frame it then creates is titled, which most embeds are not. Nothing ships with it, and pressing play with no address set says so rather than showing a black box.
- **Article card** has one link and it is the title. A card with a "Read more" as well gives a screen reader two links to the same place, one of them called "Read more". The whole card is clickable through an overlay on that one link, which costs text selection — so it is an option.
- **Pull quote:** the attribution is in the figcaption, not inside the blockquote, and `<cite>` wraps the work rather than the person. Both are the commonest mistakes in quoted markup.
- **Image gallery** treats an empty alt and a missing alt as the different things they are, and says that a caption is not a substitute for either.
- **Split feature** keeps the words first in the source whichever side the picture is on: only the grid column changes, because swapping with `order` or `row-reverse` is how a page ends up read back to front.
- **Logo wall** defaults to the tools this site is built with — a claim about us. A "trusted by" wall is a claim about someone else, and the part says so.
- **Stat comparison** allows a row with no winner. Pretending every measure has one is the commonest dishonesty in the pattern.

**Two limits in the option system, one fixed:**
1. **Fixed: a URL option could never be cleared.** `safeUrl` turned `""` into `"#"`, so every option that says "leave it empty for none" — a dozen of them — was impossible to set from a shared link or the editor. Empty is a real answer now; anything else unsafe still becomes `"#"`.
2. **Not fixed: an empty list cannot be expressed in a query string.** `parseConfig` reads `[]` as "not specified" and falls back to the default, which is the right call for a malformed URL but means a list cannot be emptied. Optional blocks use a boolean instead — the page header's trail is `showTrail`, the way `showLine2` and `showDetails` already worked.

## 2026-09-28 — D66. Four pages the catalogue had outgrown
**Decision:** `/parts`, `/in-use`, `/tested` and `/start`, with the header, footer and sitemap pointing at all four. The home page keeps a catalogue teaser rather than 126 cards.
**Why:** Adesh asked for a whole website rather than one long page. At 126 parts the home page had become a list nobody would reach the bottom of, and the two things that would actually convince a developer — that the parts compose, and that the testing is real — were claims in prose.
**What each page is for:**
- **`/parts`** lists every match, and writes the search and the type filter into the address bar with `replaceState` rather than a router push, because the server half of the page does not depend on them. The point is that a filtered list can be sent to someone.
- **`/in-use`** builds three whole screens out of the catalogue — a product page, a checkout, an admin screen — running for real, with an X-ray switch that draws a line round every part and names it, each label a link to that part. Only the chosen screen is rendered: three screens of live components on one page would be a waste of everyone's battery. Nothing is restyled to fit, and the page says so; the single exception is the hero's heading level, which is what that option exists for.
- **`/tested`** carries two tools that run the parts' own maths rather than describing it: a tracer that reads the real tab order out of the page and numbers every stop, and the contrast correction every part applies to an accent colour. The tracer is a better argument for the menu bar than any sentence about roving tabindex.
- **`/start`** is the two ways in, what a project needs, and how theming works. The licence is marked `[TODO]` rather than implied — it is still Adesh's call.

**Two things the tests caught in the new pages:**
- The tracer counted three stops for a menubar that has one: `button` matches a button with `tabindex="-1"`, which is exactly what a roving tabindex puts it on. Every selector now excludes it.
- `aria-hidden` does not excuse a contrast failure — contrast is a visual requirement, and axe is right to flag HTML text whatever the accessibility tree says. The deliberately failing samples are drawn as SVG text instead, which is what they always were in spirit.

**Also:** six of the parts written this session hard-coded an element id, which collides the moment two of them share a page. Those now use `useId`. About twenty older parts still hard-code theirs; that is recorded in PROGRESS as the next thing to do rather than fixed quietly in the same commit.

## 2026-09-28 — D67. The site is held to the target sizes its parts are
**Decision:** `e2e/site-layout.spec.ts` runs the same layout and target-size checks over the site's own pages that `e2e/layout.spec.ts` runs over every exported part, at 375, 768 and 1280.
**Why:** Adesh said things were not working on a phone. The parts were all checked; the site around them never had been, which is how the editor ended up with a 20px "Reset all" on a phone while every part inside it was 44px.
**Both checks also had to learn what a target is:**
- A card whose title link carries an `::after` at `inset: 0` is pressed anywhere on the card. The measured target is the positioned ancestor, not the text — without that, the catalogue reported 126 failures that were all correct.
- WCAG 2.5.8 exempts a target that is not displayed (a skip link clipped to a pixel until it takes focus) and one whose size is set by the line-height of the sentence it sits in. Both are now modelled, which removed 72 failures that were the standard working as intended.

**What it found, all real, all on a phone:** "Reset all" at 58x20; the header's menu button at 34px and its links at 36px; the reel's link into a part at 16px; three standalone paragraph links at 21px; "FAQ" 22px wide in the `/in-use` part list; and Get started scrolling sideways, because a grid item is `min-width: auto` and the unbreakable install command inside its scrollable block stretched the column to 679px.

## 2026-09-28 — D68. Two things a phone could not do at all
**Decision:** the reel is held by the first touch or click, not only by hover and focus; and the test bench's screen-width switcher is shown at every width, with a 320 choice added.
**Why:** a touch screen cannot hover, and Safari does not focus a button when it is tapped — so on a phone the reel kept moving and swapped the part out from under whoever was trying it. And the switcher was hidden below 640px, on the one device where you cannot resize the window. It only ever makes the bench narrower, so it does the same job on a phone as on a desktop; 320 is the width WCAG 1.4.10 asks a page to survive.

## 2026-09-28 — D69. Every element id belongs to its own copy of the part
**Decision:** every hard-coded id in the React output is prefixed with `useId()`, and `e2e/unique-ids.spec.ts` renders two of every part on one page and fails on a repeated id.
**Why:** an id is a page-wide address. Two copies sharing one means every `aria-labelledby`, `aria-controls` and `<label for>` resolves to the first — a label naming the wrong field, a button opening the other one's menu. `/in-use` puts seven parts on a page, which makes two of a part an ordinary thing to want.
**Details:**
- Ids built out of content are the same bug: `accordion-button-0`, `tabs-tab-0`, `mega-panel-products`, `sidebar-work`, `kb-to-do`.
- The form's field **name** stays exactly as it was — it is the name the answer is submitted under. Only the id is prefixed.
- Four parts are exempt and the spec says why: a skip link's target comes from an option because it has to match the landmark already on your page; a table of contents and a sticky header number the article's headings, which are the fragments a reader copies out of the address bar; a tour is pointed at selectors you give it. Two of a page inside a page is a contradiction, not a bug in the part.
- The test needed somewhere to render two of a part, so the preview route takes `?twice=1`. Nothing links to it.

## 2026-09-28 — D70. Copying works on a page that is not localhost, and copies the whole thing
**Decision:** the editor's copy buttons fall back to the old selection copy when `navigator.clipboard` is missing or refused, and say so if even that fails. The HTML/CSS/JS output gets one more button: every file at once, as the single page they add up to.
**Why:** there is no clipboard API at all on a page served over plain http — which is exactly what you get opening the dev server from a phone on the same network — so every copy button on this site did nothing there, silently. The code-block part already had this fallback; the site around it did not.
**The one page** is the exported markup with the stylesheet and the script written in where the two tags pointed at them, and nothing else added. `e2e/editor.spec.ts` copies it, loads it into a blank page as it is, and opens the date picker in it.

## 2026-10-01 — D71. New visual direction: the frosted shelf (replaces D19's Parts Datasheet once built)
**Decision:** the site moves to direction E in `scratchpad/design-directions.html`: warm paper (`#f5f2ec` / `#0f0d0b`) with a burnt-orange accent (`#c2410c` / `#fb923c`), a serif display face, and frosted-glass surfaces (translucent, blurred, lightly grained) over a faint orange, amber and rose glow. Search is the hero of the home page. Every catalogue card carries a drawing of its part. The six types become tiles, with sub-groups under each.
**Why:** an audit found parts are hard to find and the page only holds attention in its hero. Search misses everyday words ("calendar", "popup", "loader", "navbar"), the cards are text-only and look alike, the live preview never shows on a phone, and Inputs (38) and Content (28) are too broad to browse. Adesh compared four directions, liked B (the drawings on a shelf) and C (search first), picked the mix, and asked for it quieter and in frosted glass, keeping the orange.
**Motion:** quiet on purpose. Small spring lifts, View Transitions when filtering, a soft focus ring on the search box, a spotlight on card borders under the cursor, and drawings that play on hover or focus. Everything stops under reduced motion; the glass turns solid under reduced transparency.
**Findability, whatever the look:** every part gets synonyms that search reads, and search shows which word matched ("also called 'popup'"). Parts also get a sub-group. Ctrl K focuses search from anywhere.
**Risks to hold the build to:** `backdrop-filter` on 125 cards may drop frames on cheap phones (measure, and keep the blur on search, tiles and header if it does). The drawings must stay true to the parts they stand for. Text on glass must still pass contrast over the brightest part of the glow.

## 2026-10-01 — D72. No live preview on hover; the drawings do that job, and the site scrolls at 60fps
**Decision:** the catalogue cards no longer open a live preview frame on hover or focus (reverses D48).
Pointing at or focusing a card plays its drawing instead. The demo scripts (`lib/demos.ts`), the script
runner in the preview page and `?demo=1` went with it; git has them.
**Why:** Adesh asked for it: the drawings read well, and a frame loading over the card hid the drawing
it was meant to sit beside.
**Performance, measured** (`scratchpad/perf.mjs`, headless Chromium, so absolute numbers are
pessimistic): scrolling the home page ran at a median 100ms a frame, with 154 of 155 frames over 33ms.
The cause was the D71 glow: a full-screen layer blurred by 110px with shapes drifting under it, redone
every frame. Backdrop blur on glass surfaces and a grain texture on each of 125 cards cost the rest.
Now the glow is static gradients with the grain drawn once on it, and glass has no backdrop-filter
(what sits behind it is the glow, so the blur looked the same). Home and /parts: median 16.7ms, 0 frames
over 33ms. Typing in the catalogue search: median 72ms to 24ms per key, by deferring the query and
memoising the card list.
**Contrast:** axe cannot judge text over a gradient, so the glow keeps its 14% ceiling from D71 and
muted ink stays #56514a.

## 2026-10-01 — D73. The glow moves again, cards press and morph; a demo for the hero and templates
**Decision:** the glow drifts again, as three soft gradient shapes moved by `transform` only (no
filter), so the compositor moves them without repainting. Measured with the GPU on: median 16.7ms a
frame, at most a handful of frames over 33ms, against 154 of 155 for the blurred version (D72). Cards,
type tiles and buttons press in on a spring; opening a card morphs its drawing into the part page header
through React `<ViewTransition>` (the Next 16 App Router supports it with no config).
**Why:** Adesh found the still glow and the missing click feedback made the page feel flat.
**Not decided yet:** a video hero, and a Templates product. Both are in `scratchpad/expansion.html`
(served by `design-demo` on port 3401 at /expansion.html): three hero directions using real recordings of
the parts (`scratchpad/record-reels.mjs` films them from their preview pages, keyboard only), and a working
mock of Templates. Waiting on Adesh's pick.

## 2026-10-01 — D74. The home hero shows the parts at work (direction A, "Cinema")
**Decision:** the home hero is the headline and search on one side and a screen on the other that plays
real parts one at a time, with chapters to pick one, a pause button and a link into each part. The
catalogue's type tiles and cards follow underneath.
**The footage is real:** `scripts/record-reels.mjs` films six parts on their own preview pages, driven
by the keyboard with the keys shown on screen, and writes `public/reels/<slug>.webm`, a still for each, and
`lib/reels.json`. Re-run it (with the dev server up) whenever one of those parts changes. About 850KB in
all; only the clip on screen loads.
**Accessibility:** a pause button (WCAG 2.2.2), stills and no autoplay under reduced motion, paused when
off screen or in a hidden tab, each clip labelled with what it shows.
**Known limit:** the clips are WebM (Playwright records VP8). Safari plays WebM from 14.1 on the Mac and
17.4 on iOS; older Safari shows the still. An MP4 copy would need ffmpeg, which is not on this machine.

## 2026-10-01 — D75. Templates: whole pages made from the parts
**Decision:** a second product beside the catalogue. A template is a page made only of catalogue parts
(`lib/templates.ts`): Landing page, Pricing page, Checkout, Dashboard to start. The person sets a product
name, a brand colour and a theme (given to every part as `accentColor` and `theme`, which all parts take)
and which optional sections to keep. `/templates` lists them; `/templates/<id>` is the editor: preview at
three widths in both outputs, an X-ray that names each part, live page checks, and take-home.
**Outputs, all from one module** (`lib/template-output.ts`, so the editor, the registry and the tests
cannot disagree):
- Install: `/r/templates/<id>.json` is a shadcn `registry:block` whose `registryDependencies` are the
  parts' own registry URLs with the template's options in their query, plus `app/<id>/page.tsx`, which
  only arranges them. Parts are installed configured, so the page passes no props.
- React: that page.tsx.
- One HTML file: every part's generated markup in header, main and footer, their CSS and their scripts
  inlined. All template parts are HTML-first (`render.ts`); the header's demo `<main>` is dropped.
**Tested as pages** (`e2e/templates.spec.ts`): both outputs, as they come and dark with a pale colour and
every optional section off: one h1, one main, the skip link first, no axe violations, no sideways scroll
on a phone; the registry block names every part with the options applied; the editor's changes reach the
page and its checks pass.
**Copy:** every template tells one story (Northwind, a tool that keeps a small team's projects in one
place) in placeholder words, with no invented customers, figures or quotes. The landing page has no logo
wall for that reason: a "trusted by" wall needs real names.
**Live checks, not live axe:** the editor checks structure (h1, heading order, landmarks, skip link,
labels, tab stops, colour contrast) itself. Running axe in the browser would add axe-core to the site;
axe runs on every template in the tests instead, and the panel says so.
**Alternatives rejected:** templates as hand-drawn page HTML (the demo did that; it would be a second set of
components to keep tested), and live React previews inside the site page (nested landmarks and two h1s;
the preview is a frame, `/preview-template/<id>`).

## 2026-10-01 — D76. Room to breathe: a shorter menu, four home sections, a calmer hero
**Decision:** Adesh found the site cluttered. The header keeps Catalogue, Templates and About; In use, How it
is tested and Get started are still pages, linked from the footer and the sitemap. The home page is the hero,
the catalogue (after a clear break, under a visible "Browse the parts"), Templates, how it works and the test
report. The "try" reel, "See them together" and the closing call to action are gone: the video hero shows
parts working, Templates says what "See them together" said, and three calls to action were one too many.
The reel's components (`part-reel.tsx`, `mounted-part.tsx`) were deleted; git has them.
**The hero:** a one-line lede, the pause button and the way into the part on the clip itself, and chapters
as a single row of names.
**Template editor:** options and page checks together in the left column; the preview is a window of fixed
height that scrolls inside, so the install command sits right under it.
**Spacing:** sections are 80–144px apart (`py-[clamp(5rem,10vw,9rem)]`), up from 56–96px.
**Found on the way:** a `<video>` in the first HTML held up the page's load event in WebKit for good. The
hero now arrives with the still and puts the clip in after the page has loaded, which is also the faster
first paint. It does not wait for an IntersectionObserver either: in headless Chromium here one sometimes
never fired.

## 2026-10-02 — D77. One page width, gutter and rhythm; three looks to try
**Decision:** every page container is `page-wrap` (width, max-width and gutter from tokens: `--page-max`,
`--gutter`, `--section-y`, `--grid-gap` in `app/globals.css`) instead of sixteen copies of
`mx-auto max-w-7xl px-4 sm:px-6`. Adesh asked for a wider, cleaner page on large screens; rather than
guess, `html[data-look]` offers three sets of values: **now** (1280px), **wide** (1536px, more gutter and
section space) and **clean** (1440px, flat surfaces instead of frosted glass). A switcher in the corner,
development builds only (`components/look-switcher.tsx`), keeps the choice across pages.
**Pending:** Adesh picks one; its values become the base tokens and the switcher, the `look` line in the
root layout's inline script and the other looks are deleted.

## 2026-10-02 — D78. Five more templates, and 300px is tested
**Decision:** contact, help centre, changelog, about and a 404 page join landing, pricing, checkout and
dashboard (nine in all), in the same Northwind story with no invented claims. Every template is tested at
375px and at 300px in both outputs: no sideways scroll (`e2e/templates.spec.ts`).

## 2026-10-02 — D79. The hero is a live reel, not video
**Decision:** Adesh wanted the hero to feel like a launch film. The webm clips are gone; the hero plays six
real parts live in a frame (`/reel`, `components/motion-reel.tsx`) driven by a script: a cursor that
glides with easing, click ripples, typing, key presses. The page around it (`components/hero-reel.tsx`)
runs a camera (a transform on the frame, eased, clamped so the frame's edge never shows, pushed further
in on phones), lower-third titles that fade out of the way, and a key caption. Chapters jump to a scene;
pause, off screen and a hidden tab freeze it; reduced motion shows stills (`scripts/reel-stills.mjs`
photographs the reel itself) until Play.
**Focus:** a script moving focus inside a frame takes it from the page around it in every browser, even
when the frame is `inert` (spike: `scratchpad/focus-spike*.mjs`). A sandboxed frame with an opaque origin
stops that, but Next's dev server refuses its script requests (no Referer, and allowing the `null` origin
would reopen the dev-server hole Next closed on purpose). So in the reel nothing takes real focus:
`focus()` only marks the element (drawn as a ring) and `showModal()` only sets `open` (the backdrop is
drawn by CSS). `e2e/reel.spec.ts` types in the page while the reel opens a dialog, in Chromium and WebKit.
**Alternatives rejected:** a better-edited video (still a film of the parts, heavier, and stale when a part
changes), and Lottie or After Effects exports (drawings, not the parts).

## 2026-10-02 — D80. A page builder, no accounts
**Decision:** `/build`: parts from the catalogue dragged onto a page (or added with a button), reordered by
drag or by Move up/down, each set up with its own options panel (the part editor's, without colour and
theme, which are the page's), the page given a name, a colour and a theme, started empty or from any
template ("Keep building it" in the template editor carries its edits over). The header stays first and
the footer last wherever they are dropped, so the page keeps its landmarks.
**How:** a built page is turned into a template (`lib/page-builder.ts`, `pageTemplate`), so the preview,
the live checks and every output are the ones templates already have and test.
**Kept:** in this browser (localStorage) and as a link: the page as JSON with each part's options as its
query string, in URL-safe base64, read with the same validation as a part's own address (`parseConfig`).
One of each part per page (two would install over each other), 30 parts at most.
**Outputs:** a Next.js project that runs as it is (`/download/<name>.zip`: package.json on the versions
this site is tested with, app/page.tsx, one file per part with its options set, README; zipped with Node's
zlib, no dependency), one HTML file (`/download/<name>.html`; the three parts with fixed markup now work in
it too), and a shadcn `registry:block` (`/r/pages/<name>.json`).
**300px:** `e2e/builder.spec.ts` puts every part in the catalogue on pages, 30 at a time, at 300px, in both
outputs. Only the countdown overflowed (by 4px); its boxes wrap now.
**Later:** accounts (save pages server-side, a page list); two of the same part on a page; other
frameworks (needs D6's spike first).

## 2026-10-03 — D81. The clean look, 1600px wide
**Decision:** Adesh picked Clean from the D77 trial and asked for a 1600px container. `--page-max` is 100rem,
with Clean's gutter, section and grid spacing. Surfaces are flat paper with one hairline in both themes
(`--color-glass` is the paper, its edge the rule); `glass` and `btn-glass` no longer cast a shadow.
`--color-shadow` itself is kept for things that are not surfaces (the preview frames). The look switcher,
the other looks and the `look` line in the root layout's script are gone.
**Open:** a hover glow and a moving, interactive home background. Three directions are in
`scratchpad/glow-demo.html` (A Spotlight, B Living grid, C Aurora), waiting on Adesh's pick.

## 2026-10-03 — D82. The spotlight: a light that follows you, and cards that light where you point
**Decision:** Adesh picked A (Spotlight) from `scratchpad/glow-demo.html`, and asked that phones see it too.
- **Behind every site page:** a soft light (`.site-follow` in the site glow) eases toward the pointer, or the
  finger on a touch screen, by transform (`components/spotlight.tsx`). On a touch screen it also wanders by
  itself (CSS), so it is seen without touching. Reduced motion: it stays put; the wander stops.
- **Cards** (`.spot`: catalogue cards, type tiles, template cards on the home page and the gallery): the
  border lights where the pointer is, with a faint wash inside. With a keyboard: on focus. On a touch screen:
  while a finger is on a card, and as cards cross the middle of the screen while scrolling (`.is-lit`).
- **Buttons** (`btn-accent`, `btn-glass`): an orange ring on hover, and while pressed on a touch screen.
**Contrast:** the light peaks at 8% (10% in dark), the most that keeps muted and link text at 4.5:1 where it
crosses the brightest glow (worked out by hand; axe cannot see gradients).
**Performance:** a 56vmax light with `will-change` cost scrolled frames without a GPU (43 over 33ms of 224
against 1); at 36vmax without `will-change`, 1 of 243, and 0–1 with the GPU on (`scratchpad/perf.mjs`,
V=spot).
**Responsive:** `e2e/site-layout.spec.ts` now runs every site page at 300, 375, 768, 1280 and 1920px, plus
templates and the builder. It found three pages that scrolled sideways at 300px (the contrast table on
/tested, the template editor and the builder, whose grid columns sized to their widest control); fixed.

## 2026-10-04 — D83. The builder is built around the page
**Why:** Adesh found building a page hard, and drag and drop "not working". Reproduced: a part dropped on the
page preview (the big, obvious target) did nothing, because the preview is a frame and HTML drag and drop
never reaches into it; only the small "Your page" list took drops. The preview sat below the list and a long
options panel, off the first screen; the parts were a plain list of 125 names; touch could not drag at all.
**Decision:** three panes filling the screen. Left: the parts with a drawing of each, page sections first;
click adds below the chosen section, or drag onto the page. Middle: the page itself; dragging over it shows a
"Drop here" line where the part will land; clicking a section chooses it (outlined, with move, drag and
remove beside it); "Uses the parts" switches clicks back to working the parts. Right: layers (reorder by
handle, buttons or keyboard) and the chosen section's options, or the page's settings. An empty page offers
the nine templates as one-click starts. Downloads, the link, the install and the page checks are in one
"Get the code" dialog; the button says how many checks pass.
**How:** dragging is pointer events with the pointer captured, so moves over the frame still reach the
builder, and it works with a mouse, a pen and a finger (by the handle on each part, so the list still
scrolls by touch). Near the frame's edge the page scrolls; near the screen's edge the window does. The
frame stays a real window, so parts that open dialogs still work in it.
**Tested:** `e2e/builder.spec.ts`: a template in one click; a drag onto the page lands where dropped; a drag
in the layers list; keyboard moves keep focus; clicking a section on the page chooses it; a touch drag
through CDP on an emulated phone; axe on the builder. `/build` fits from 300 to 1920px in three browsers.

## 2026-10-03 — D84. Builder fixes: one scroll per pane, section width and spacing, preview, links, click to edit
**From Adesh's list** (the defects; the larger items are planned separately):
- **Scrollbars and the gap under the footer:** the builder now takes exactly the screen below the site header
  on a large screen (its `main` is `lg:flex-none` with a fixed height: `flex-1` let it grow to its content),
  and each pane scrolls on its own, thinly: parts, layers, options. The options panel no longer scrolls
  inside a scrolling pane. The gap under the footer was screen-reader labels inside the scrolling panes,
  positioned against the page because no ancestor was; every scroller is `relative` now.
- **Containers:** every section has a width (Full, Wide, Medium, Narrow) and space above and below (None,
  Small, Medium, Large), in the builder's options column. `sectionFrame` in `lib/templates.ts` turns them
  into the same frame for the preview, page.tsx and the HTML file. Left at Automatic in the builder, content
  sits in one consistent wide column, banners run edge to edge, forms in a reading column. Templates keep
  exactly the frames they had.
- **Footer at the bottom:** every page (preview, page.tsx, HTML) is a column at least the screen's height,
  with `main` taking the slack, so a short page keeps its footer at the bottom.
- **Click text to edit:** clicking a heading, a paragraph or a button on the page chooses its section and
  focuses the field that holds that text.
- **Links:** while trying the page or previewing it, a link to another page no longer takes the frame away
  (it showed this site's 404); a note says where it goes on the real site. Links within the page still work.
- **Preview:** full screen, with the widths, Escape to close (also from inside the page), and "Open in a new
  tab" (`/preview-page#p=…`).

## 2026-10-03 — D85. Pictures and video in built pages
**Asked:** pictures dragged into place, YouTube that works. **Adesh chose:** pictures live in the browser and
go out in the downloads (no accounts yet).
- **Kept pictures** (`lib/pictures.ts`): a picture dropped on a section, or chosen in its "Pictures" box, is
  kept in IndexedDB and written into the page as `https://assets.invalid/<name>`. `.invalid` never resolves,
  so the address passes every part's own address check and survives saving and links unchanged.
- **Showing them** (`public/pictures-sw.js`): a service worker answers those addresses from IndexedDB, for the
  builder's frame and for "Open in a new tab". No part had to change. Chromium does not hand a worker a
  frame already open, so the builder loads its frame once the worker is in charge (a moment on a first
  visit, at once after). Pictures this browser does not have (someone else's link) are left empty: placeholders.
- **Downloads:** the Next.js project is zipped in the browser (`lib/zip-browser.ts`, stored, not compressed)
  from the project's files (`/download/<name>.json`) plus `public/images/<name>`; the HTML file has them
  inline as `data:` addresses. The install command and the link leave kept pictures out, and say so.
- **Where pictures go:** any option or list field named `…src` or `…image`: hero (new `imageSrc`), split
  feature, image gallery, logo wall, carousel, lightbox, avatar group, the video's poster.
- **Video:** the video part takes a YouTube (watch, youtu.be, Shorts, live) or Vimeo link as it is copied,
  and plays it from YouTube's no-cookie host. Its HTML output now refuses a non-http(s) address too.
- **The site's CSP** now allows `img-src https:` (people's own images, wherever hosted) and `frame-src` the
  two players. Scripts stay same-origin.

## 2026-10-03 — D86. The builder makes websites
**Asked:** "a proper website with more pages, just like we show in the navigation", with links that work.
- **Model** (`lib/site-builder.ts`): a site is pages (title, address, their own sections) sharing one top
  (header or mega menu) and one bottom (footer). `pageView` shows a page as an ordinary built page, so every
  builder tool, the preview and the checks work unchanged; `fromView` splits an edit back into shared and
  page. The home page is always `/`; other addresses are made unique from what is typed; 12 pages at most.
- **The menu:** with more than one page, the header's and footer's links are the site's pages (turn it off in
  Website settings to write them by hand; while it is on, their link lists are not offered for editing).
- **Builder:** page tabs above the page and "+ Add a page"; Page settings (name, address, delete) and Website
  settings (name, colour, theme, menu); templates fill the open page and keep the site's header and footer;
  in the preview and while trying the page, a link to one of the site's pages opens that page.
- **Links:** `encodeSite` compresses the site (deflate-raw through the platform's CompressionStream, the same
  in the browser and in Node): a three-page site is about 2 KB. `decodeSite` also reads every page link from
  before, as a one-page site, and refuses anything that unpacks past 2 MB. This browser keeps the site as
  plain JSON (`built-site`); a page kept before sites carries on.
- **Outputs** (`lib/next-project.ts`): a Next.js project with a route per page, the shared parts in
  `components/` and each page's own parts in `components/<page>/` (two pages can each have their own page
  header); HTML files per page, linked to one another (`pricing.html`), zipped with their pictures; one
  shadcn item that writes every page and part. The downloaded three-page project installs and builds.
- **Found on the way:** the page view must be memoised. Rebuilt every render, it re-ran the effects that
  watch it every render: the page was re-sent to the frame endlessly and the checks never ran.

## 2026-10-04 — D87. The site theme: presets first, every part takes it
**Adesh chose:** direction A, "Presets first" (`scratchpad/theme-demo.html`), and the full theme across all
parts. **What it is** (`lib/theme.ts`): six finished themes (Clean, Editorial, Bold, Calm, Mono, Warm),
each a brand colour, a colour family, heading and body fonts, corners, a button shape and spacing; "Fine-tune"
changes any one. Fonts are system font stacks, so a site still loads nothing from anywhere. Every colour
family keeps text at 7:1 and muted text at 4.5:1 on its surfaces in light and dark (tested).
**How every part takes it** (the contract, `scripts/theme-codemod.py`, kept as the record): parts read
`--bc-light-*`/`--bc-dark-*` (surface, sunk, text, muted, line), `--bc-radius-*` (and `--bc-radius-button`
for buttons on the accent), `--bc-font-body`; a page's headings take `--bc-font-heading`; section spacing
takes `--bc-space`. Every value falls back to the part's own, so a part with no theme around it looks as it
always did. "Follow the system" now also obeys a page's choice, `<html data-bc-scheme="light|dark">`. Under
a theme a part's own corner option is hidden: the theme's corners apply. iPhone corners stay the iPhone's.
**The visitors' switch:** a header option (`schemeSwitch`), off by default: a toggle button, "Dark theme",
pressed while dark; it sets `data-bc-scheme`, is remembered (`localStorage` "bc-scheme"), and the Next.js
layout and the HTML pages put the choice back before they paint. Turning it on in the builder sets the site
to follow the system, since only parts that follow the system move with it.
**Outputs:** the preview gets the theme's stylesheet; the Next.js project `app/bc-theme.css`, imported by its
layout; the shadcn item the same file, imported by each page; the HTML pages the stylesheet inline.
Templates are unchanged: they have no theme. A new site starts on Clean.
**Found on the way:**
- HTML-first parts set to follow the system wrote their light palette inline, which beat the stylesheet's
  dark block: their HTML output never turned dark. They leave it to the stylesheet now.
- form, table and pagination's HTML renderers imported helpers from their React (client) files, so a site's
  HTML download failed with any of them on it. The helpers are copied in.
**Tested:** every part under Editorial (light) and Bold (dark), React and HTML, with axe
(`e2e/theme.spec.ts`); the header switch in both outputs and three browsers; a downloaded themed site run with
`next start`: theme, switch, the choice surviving a reload and a page change, no console errors.

## 2026-10-04 — D88. More pages, whole websites, and suggestions while building
**Adesh asked:** "pre-built more pages and a whole website", suggestions from our parts while someone builds,
more components and page templates.
**Parts:** six HTML-first sections a website needs: text section, picture (a drawn placeholder until it has
an address; an unsafe address, which `parseConfig` turns into `#`, also means "no picture"), testimonials
(only `[TODO]` quotes, names and roles ship: no invented people), contact details (`<address>` around a
`<dl>`, mailto and tel links), post list (dates in words by hand, titles one level under the heading) and
an announcement bar (an `aside` named Announcement, a banner part, so it sits in the shared top).
**Page templates:** nine more (home, services, blog, article, team, careers, FAQ, sign in, coming soon). Sign
in is by email link, because the form part has no password field and a sign-in made of loose parts would not
be a form. A template's announcement bar goes under the header: the skip link must stay the first stop.
Benefits, open roles, authors and quotations are `[TODO]`.
**Whole websites** (`starters` in `lib/site-builder.ts`): a list of [page title, template] pairs. Every page
takes the first page's header and footer and the menu lists the pages, so the existing site model, outputs
and tests apply unchanged. Started from the builder's empty home page, its "Fill this page from" list (asks
before replacing work), or /templates via `/build?site=<id>`. No shop website: there is no product list.
**Suggestions** (`suggestions` in `lib/page-builder.ts`): learnt from the templates, not a hand-kept map.
First what the page lacks (a header, its one h1, a footer); then what follows the chosen part in at least two
templates (once is one template's choice, not a pattern); then the parts of the templates sharing the most
parts with the page. Never a part already on the page; four at most.
**Found on the way:** the feature grid keyed items by title, so two items with one title broke React. Keyed
by position now; the template React tests fail on any console error, which is how it was caught.

## 2026-10-04 — D89. The site's colour control is light or dark, starting from the system
Adesh asked to drop the "system" option. The site opens in the system's theme and the control shows it;
picking the other one pins it (stored, survives reloads). Picking what the system says unpins, so the site
follows the system again as it changes, with no third button to explain.
**Found on the way:** the header renders the control twice (desktop, and inside the phone menu), and both
radio groups were named `theme`, so the browser made them one group and only one radio across both could
be checked. Each now gets its own name from `useId()`. `e2e/site-pages.spec.ts` covers it.

## 2026-10-04 — D90. Versions, a test record per part, a report link, and counting what is taken
**Adesh asked** for the four cheap improvements: fixes reaching people who copied a part, the testing claim
made checkable, known debt paid, and knowing what people use. He chose our own counter (no third party) and
a report link by email to hello@devstash.me.
**Versions** (`lib/versions.ts`): a dated history per part; numbers are worked out from it (added = minor,
fixed = patch), not typed. 1.0.0 is what was live when versions began (3 October 2026); every part then took
the site theme (1.1.0); hero, video embed and header gained options; feature grid, notification list and
toolbar had their duplicate-key bug fixed. Fixes to things that never shipped (the site downloads) are not
listed: a reader's copy never had them. The six parts from D88 start at 1.0.0. Every file a part gives out
names the part, its version and its changes link on its first line (`stamp` in `lib/sources.ts`, so the
editor, the registry, templates and every download carry it; a whole HTML document keeps its doctype first).
**Test record** (`scripts/test-results.mjs` → `lib/test-results.json`): the script runs the parts' own specs
with Playwright's JSON reporter and writes, per part, the day, the commit (with "+" if it held uncommitted
changes) and passed/failed per browser. Only a run writes it. Shown under the editor with the changes and
the report link (`components/part-record.tsx`). Not CI yet: a public repo and Actions are Adesh's call.
**Debt:** the twenty hard-coded ids were already fixed in D69 (CLAUDE.md still said otherwise; corrected).
The builder's blank frames under eight workers are the dev server's load, not the product: the page always
reaches the frame (the worker handshake only holds back pictures).
**Counting** (`lib/counter.ts`): installs (the registry routes) and downloads (the download route) are
counted where they are served; copies and a template's HTML download (made in the browser) by a beacon to
`/api/count`, which takes only known names. One Upstash Redis hash per month, a field per event and name
(`install:date-picker`), sent with `after()` so nothing waits on it. Nothing about who. Without the store's
variables nothing is counted. Checked against a stand-in store on a production build. A template install
also counts each part it pulls in, as the CLI fetches them. The About page says what is counted.

## 2026-10-04 — D91. A registry index and llms.txt, for the shadcn CLI, its MCP server and AI assistants
`/r/registry.json` lists every part (served by the part route), so a components.json namespace
(`"@build-components": "<site>/r/{name}.json"`) can view, search and add parts by name; checked with the real
CLI. `/llms.txt` and `/llms-full.txt` are generated from the registry and schemas (`lib/ai-index.ts`): every
part, template and option, so they cannot drift. By name a part comes with its defaults; options go in the URL.

## 2026-10-04 — D92. Framework outputs: thin native files on the tested plain output (decision 6 settled)
**Chosen over Mitosis and over a rewrite per framework:** each part's plain script becomes
`<slug>.core.js`, a module whose `mount(container)` starts it inside one container and returns what undoes
it. Vue (SFC), Svelte 5, Angular (standalone, `ViewEncapsulation.None`), Solid and a Web Component (one file,
its stylesheet inside) each hold the markup for the chosen options in a `display: contents` wrapper and
mount the core in their own lifecycle. Nothing is rewritten per framework, so a framework is exactly as good
as the plain output. Options are baked in at export, as in the HTML output.
**Clean-up:** `mount` notes what the part attaches outside its markup while starting (listeners on document,
window and media queries, intervals, observers) and takes it off on unmount. ponytail: an interval started
later (a carousel's autoplay) outlives an unmount; listeners added later are removed by the part itself.
**Tested:** `e2e/frameworks.ts` compiles every output with its framework's own compiler (vue/compiler-sfc,
svelte/compiler, babel-preset-solid, Angular JIT), bundles it with esbuild (runtimes shared) and every part's
spec runs on it (`targets` in `e2e/helpers.ts`, `FW_PARTS`). Full sweep: 12,176 passed; the 15 failures were
the header's second start-up line, fixed. `e2e/frameworks.spec.ts` checks an unmounted component leaves no
interval, observer or page listener (and fails when the clean-up is removed). The part editor's third output
shows each framework's files and downloads them as a zip. Dev dependencies only: users install nothing.

## 2026-10-04 — D93. Right to left
`e2e/rtl.spec.ts` renders every part left to right and right to left in both outputs and fails on any box
that did not mirror (inline pieces of an English sentence excepted: English stays left to right inside an
RTL page). 24 parts did not; their left/right styles became start/end (`scripts/rtl-codemod.py`, run on those
parts only; class lists and rules that also move along x stay physical, as half-logical would split them).
The switch knob and the tree's chevron turn the other way. The nine parts whose scripts read the arrow keys
swap Left and Right in RTL (`keyOf`); `e2e/rtl-keys.spec.ts` checks Left in RTL leaves each part exactly where
Right leaves it in LTR. All 262 mirror; the changed parts' own specs pass in three browsers.

## 2026-10-05 — D94. Languages: every word a part says by itself is an option
**Chosen over a translation layer at runtime:** each word a part says without being told (a label, a hint,
an error, an announcement, a count) became a text option in a "Words" group, defaulting to the English it said
before. A part speaks whatever its options say, and the file you take holds only the words you chose; nothing
is looked up at runtime. 92 parts have Words; the other 39 only say what their content options say.
**Rules:** words with something put in them name it, `{count}`, `{name}`, filled by a small `fill()` in each
file (no shared helper: each output stands alone). Counts come as two options, one and other: enough for the
ten languages' everyday counts, not every plural rule. HTML-first parts pass words to their script as
`data-*` attributes or one `data-words` JSON attribute; scripts with a config block read `config.x`. Demo
filler is marked `data-demo`. Month and day names come from the page's `lang` (date picker, `toLocaleDateString`),
not the browser's.
**Dictionary:** `lib/dictionary.ts` (English → es, fr, de, pt, ar, he, hi, ja, zh) and `translate()` in
`lib/languages.ts`. Written without a native speaker: [TODO: have each language reviewed]. The editor's Words
tab has a Language picker that fills every Words option in; it reads its language back from the options, so
the link keeps it, and shows "Your own words" once one is edited. The preview frames take the language's
`lang` and, for Arabic and Hebrew, `dir="rtl"`. A link with another language carries every word, so it is long.
**Tested:** `e2e/languages.spec.ts` renders each part in English and German (the "de" variant from
`e2e/generate.ts`) and fails on anything said in both that is not the person's own content: every part passes
in both outputs. It also fails on a Words option the dictionary lacks, and on a stray control character in a
part's files (one slipped into seven files as an escaped regex backreference). Words said only on interaction
were found by reading the sources (`scratchpad/words2.ts`) and converted too.
**Changed English, on purpose:** the searchable select's "Choose a country from the list." is now "Choose one
from the list." (no a/an guessing); the search says "1 result." (was "1 results."); the HTML/CSS/JS cart's
heading count now follows the basket. **Left as is:** am/pm in the time picker's 12-hour format, KB/MB and
"bytes" in the upload, and a label put lower case into a sentence ("Show {name} options").

## 2026-10-05 — D95. Forms that send
**Adesh asked** for points 8 to 11 and said to decide without asking. The form and the newsletter have a Send
to option (Behaviour, a URL): on a valid submit they POST their fields there (`FormData`, `Accept:
application/json`), the button says Sending… (`aria-disabled`, a second press is ignored), and a failure is
said in an alert while what was typed stays. Empty means nothing is sent, as before: a preview or a page
still being built. The form element also gets `action` and `method="post"`, so it posts without JavaScript.
**Chosen over a server action:** a server action would make the React file different from every other
output; a URL works the same in all seven and with any form service. The Next.js download fills every empty
Send to with its own `/api/forms` route, which passes each message to `FORM_WEBHOOK_URL` as JSON (`{text,
fields}`: Slack, Zapier, Make) or logs it, caps a message at 100 kB, and sends a no-JavaScript post back to
its own page (never off-site). Checked on a built project: JSON reply, the webhook received the fields, the
303 back. The site's own CSP keeps preview frames from posting elsewhere; a preview with an outside Send to
says it did not go through, which is true. Tests answer the sends with `page.route` (`answerSends`).
**Found on the way:** the newsletter's two messages were hard-coded English that D94 missed (it only spoke on
submit, and matched its consent message by its English text). They are Words options now, the field that is
wrong is kept as state, and a source scan (`scratchpad/said.mjs`) found no other part like it.

## 2026-10-05 — D96. What each page needs to go live
A page has a description (160 characters) and a share picture (a web address); the site has an address
(reduced to its origin). The Next.js download gives each page `export const metadata` (title, description,
Open Graph picture, canonical), a layout with `metadataBase` and a title template, and, with an address,
`app/sitemap.ts` and `app/robots.ts`. The HTML files get the same meta tags and, with an address,
`sitemap.xml` and `robots.txt`. Everything read from a link is checked (`siteAddress`, `pictureAddress`):
anything that is not http(s) is dropped. Pictures are addresses, not uploads: the builder's own pictures
(D85) stay in the browser, so they cannot be a share picture's public address.

## 2026-10-05 — D97. A shop
A new part, the product grid (cards that are one link each: name as a heading, price and an optional note as
words, the picture drawn above but read after; no pictures ship, an unsafe address is never loaded). Three
templates, Shop, Product page and Basket, and a Shop website starter: Home (the grid), Product, Basket,
Checkout, About, Contact. Every card in the starter opens the one product page, the one to copy per product.
Delivery and returns are `[TODO]`, not invented. There is still no stock, payment or order handling: the
card fields and the basket are front ends that hand over to a payment provider, as before.

## 2026-10-05 — D98. Putting it online; no accounts
**One-click deploy, decided as one command.** A true one-click needs either a public template repository or
an integration registered under Adesh's Vercel or Netlify account; both are public, irreversible steps that
are his. The downloaded project already builds and runs anywhere Next.js does, so the README and the
builder's download dialog say `npx vercel` or `npx netlify deploy --build`, where `FORM_WEBHOOK_URL` goes, and
that the HTML files go on any static host. **Accounts: not built.** What they would add (a site on two
devices, a site to review) the compressed link already does; accounts would add sign-in, a database, a
privacy policy and personal data to look after, for a product with no users yet. Revisit when people ask
for a list of their sites across devices.

## 2026-10-05 — D99. One-click deploy, with Vercel's Deploy Button
**Adesh asked for one click.** Vercel's Deploy Button can now fill in an environment variable's value
(`envDefaults`), which makes it possible without an OAuth integration (which would need a marketplace listing,
a EULA and a privacy policy). One public template repository serves every site: `deploy-template/` in this
repo, published as `github.com/adeshukla/build-components-site`. Its build runs `get-site.mjs`, which fetches
the site's Next.js files from `SITE_FILES_URL` and builds them. The builder's **Deploy to Vercel** posts the
site to `/api/deploy`, which keeps it in Upstash under the start of its SHA-256 (`lib/site-store.ts`, the same
database as the counter; the same site is kept once, never deleted) and answers with the Deploy Button
address: repository, project name, and `SITE_FILES_URL` pointing at `/download/<name>.json?s=<id>`. Without the
store, a link up to 6,000 characters travels in the address itself (a six-page shop is about 2,300); a bigger
one is refused with a pointer to the download. Builds fetching `?s=` are not counted as downloads.
**Shown only when set up:** the button appears once `NEXT_PUBLIC_DEPLOY_TEMPLATE` is set, so it can never send
anyone to a repository that does not exist. The person signs in to Vercel and presses Deploy; Vercel clones
the template into their own GitHub. The deployed repository holds the template, not the site's code, so its
README says how to take the code over (fetch once, commit, build with `next build`).
**Checked:** the route in Node (the Deploy Button address and its parameters, a bad body refused); the store
against a stand-in for Upstash's REST API; the template installed and built with a six-page shop fetched from
the dev server; its errors when the variable is missing or the site is gone; a test that the template's
packages equal the project's. Not checked: a real Vercel deploy, which needs the repository to exist.
