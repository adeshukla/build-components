# Progress

Last updated: 2026-10-01 (session 13)

## Latest (session 13, later): a video hero and Templates, on `dev`
- **Hero (D74):** headline and search beside a screen playing six real parts, filmed by
  `scripts/record-reels.mjs`. Pause button, stills under reduced motion, paused off screen.
- **Templates (D75):** `/templates` and `/templates/<id>`: four pages made from the parts (landing,
  pricing, checkout, dashboard), set up by name, colour, theme and sections, checked live as a page, and
  taken home by one install command, a page.tsx, or one HTML file. `e2e/templates.spec.ts` tests both
  outputs as pages. Linked from the menu, the footer, the sitemap and a band on the home page.
- **Glow and press (D73):** the glow drifts again by transform only; cards, tiles and buttons press in;
  opening a card morphs its drawing into the part page.
- The demo of the hero options and Templates is `scratchpad/expansion.html` (served by `design-demo`).
- **Next for templates:** sign in, account settings, a blog article and a 404. Sign in needs the form
  part set up as a sign-in form; check its options first.
- **Not decided:** whether to fold "How it is tested" and "Get started" into other pages so the menu is
  shorter. Templates was added to the menu beside them for now.

## Earlier in session 13: the frosted shelf is built, on `dev`

**This session was findability and a new look.** An audit, a demo of four directions
(`scratchpad/design-directions.html`, gitignored; `design-demo` in `.claude/launch.json` serves it),
Adesh picked a mix of two (D71), and it is built on the real site. Not pushed, not deployed: on `dev`
until Adesh says ship.

### The audit (why parts were hard to find)
- Search missed everyday words: "calendar", "popup", "spinner", "loader", "navbar" found nothing.
- Cards were text-only and alike; the live preview is hover/focus only, so a phone never saw one.
- Inputs (38) and Content (28) were too broad to browse.

### What is built
- **Look (D71, `DESIGN.md`):** warm paper, burnt-orange accent, Instrument Serif display, frosted
  glass (`glass` / `glass-flat`) over a fixed faint glow. Header, footer, logo, favicon and share
  image redrawn. The Datasheet tokens (board, silk, pad) are gone; paper/ink/rule kept their names.
- **Search is the home hero:** the catalogue sits under the headline. Search reads each part's new
  `aka` words and says "also called 'popup'" when that is why a card is there; matches are marked in
  the name. `/` and Ctrl K (⌘K) focus it. Suggested words under the box.
- **Types and groups:** type tiles (radios) with counts and two drawings; a chosen type offers its
  groups (`groups` in `lib/parts.ts`; every part has one). `?group=` goes in the address bar.
- **A drawing of every part** (`components/part-drawing.tsx`, 125 SVG sketches) on every card; they
  play on hover and focus. The live preview now waits 450ms so the drawing plays first.
- Preview and harness pages keep a plain white page (`.bare-page`): parts are tested as before.

### Later the same day (D72)
- The live preview on hover is gone (Adesh): the drawings play instead. `lib/demos.ts` and the
  preview script runner are deleted.
- Scrolling was slow: measured, the blurred drifting glow made nearly every frame 100ms. Now static
  gradients, no backdrop blur, grain drawn once: home and /parts scroll with no frame over 33ms. Typing
  in search 72ms to 24ms per key (deferred query, memoised cards). 318 Chromium tests pass.
- Adesh asked about offering more than components (ready-to-use templates) and trimming pages: see
  the suggestion in the session transcript; nothing built yet.

### Found on the way
- /in-use scrolled sideways at 375px because of the stat-comparison table (from 35f594b, not this
  session): a grid item would not shrink. `min-w-0` on the X-ray wrapper.
- The home reel scrolled sideways at 320px (it did in the old design too). Fixed.
- axe measures text against the glow as if unblurred: glow opacity capped at 0.14, muted ink darkened.

### Tests
- New: every part has a valid group, aka words and a drawing; a part is found by another word and says
  so; Ctrl K; a group narrows the list and goes in the URL.
- `home`, `site-pages`, `site-layout` and `editor` across chromium, webkit and iphone: **317 passed,
  278 skipped (Chromium-only specs), 2 failed**. Both failures were the dev server answering two font
  files with 400 while it recompiled the new font at the start of the run; they pass on a rerun.
- Earlier in the session, `date-picker` and `modal` component suites passed with the new site CSS.
- Not run this session: the other component suites. Only the site CSS changed under them, and the
  harness page keeps its old plain background, but the full sweep is worth a run before shipping.

### Needs Adesh
1. Look at it on `dev` (`pnpm dev`), in both themes and on a phone. Say "ship" when happy.
2. `.impeccable/design.json` still describes the Datasheet: regenerate it from DESIGN.md or delete it.
3. The licence question from session 12 is still open.

## Previous status (session 12)

**This session was the phone, and the id collisions.** Adesh said features were not working on a
phone and that some of it lacked what the desktop had. Both were true.

### What was wrong on a phone, and is not now
- **Get started scrolled sideways.** A grid item is `min-width: auto`, so the unbreakable install
  command inside its scrollable block stretched the whole column to 679px on a 375px screen.
- **The reel could not be held.** It stopped only while hovered or focused; a touch screen cannot
  hover, and Safari does not focus a button when it is tapped, so it kept moving and swapped the part
  out from under whoever was trying it. The first touch holds it now.
- **The screen-width switcher was not there at all** below 640px — on the one device where you cannot
  resize the window. It is shown everywhere now, with a 320 choice.
- **Every copy button did nothing** on a page served over plain http, which is what you get opening
  the dev server from a phone on the same network: there is no clipboard API there. They fall back to
  the old selection copy, and say so if even that is refused.
- **Seven targets were under the minimum size**, in the site's own chrome: "Reset all" at 58x20, the
  header menu at 34px and its links at 36px, the reel's link into a part at 16px, three standalone
  paragraph links at 21px, and "FAQ" at 22px wide.
- **Inline confirm's row did move** on a phone after all: the delete button leaves the line when the
  question appears, and the name rose to meet the shorter line.

### What is new
- **`e2e/site-layout.spec.ts`** holds the site's own pages to what its parts are held to, at three
  widths — the check that had never existed (D67). Both it and `layout.spec.ts` now measure the real
  target (a card pressed through a full-bleed `::after`) and model WCAG 2.5.8's two exceptions.
- **`e2e/unique-ids.spec.ts`** renders two of every part on one page and fails on a repeated id
  (D69). Twenty parts hard-coded one; they use `useId()` now.
- **Copy all three as one page** for the HTML/CSS/JS output (D70), tested by loading what it copies
  into a blank page and opening the date picker in it.

### Test state (session 12)
- `site-layout` (114), `home`, `unique-ids` (121 parts, two copies of each on one page), `editor` on
  chromium (127), and every spec touched by the id change (1,005 across the three browsers) are green.
- **The whole sweep ran end to end for the first time: 8,304 tests, 7,777 passed, 524 skipped, 3
  failed.** That is the verification session 11 left outstanding.
  - One was real, and mine: making Get started stop scrolling sideways turned its install command
    into a block that scrolls instead — and a region you can only reach by dragging is no use to a
    keyboard (axe `scrollable-region-focusable`). It takes focus now. The fix is the answer to the
    fix; the sideways scroll was the worse of the two.
  - One was a Windows worker crash (`code=3221226505`) that took a team-grid test with it.
  - One was a WebKit drag landing a sortable item one place out.
  - All three suites pass on a rerun: 255 tests green.

### The count
The catalogue is **125 parts**, all in stock. Session 11's note of 126 was one out; `lib/parts.ts` and
`lib/registry.ts` agree on 125, and the pages read the number from `inStock.length` rather than a
written-down figure.

### Still to do — doesn't need Adesh
- Configurable UI strings for the date picker and select (button labels, error messages).
- Screen-reader pass (NVDA) on the parts added in sessions 10 and 11, then fold anything learnt into
  the checklists.
- Run the sweep against a production build (`next build && next start`), not only `next dev`.

### Shipped (2026-09-28)
Adesh said ship. Thirteen commits pushed to `main`; Vercel built and the site is live at
https://build-components.devstash.me with all 125 parts and the five pages.
- `next build` is green locally (no errors, every route accounted for).
- **The one deployment unknown is now answered:** `/r/<name>.json` works on the real Vercel deploy —
  `outputFileTracingIncludes` does ship `registry/`, and the route reads it at request time and
  returns the file with its content. Checked on two parts.
- Checked live on a 375px viewport: `/start` does not scroll sideways, its install command takes
  focus, the header menu is 44px, and the bench's width switcher offers 320 / 375 / 768 / full.

### Needs Adesh
1. **A licence for the exported code.** `/start` is live saying `[TODO: no licence has been chosen]`.
   That is honest but unhelpful to anyone who reads it; MIT is the usual choice, and it is your call.
2. **Manual checks:** the checklists with NVDA and on a real iPhone. Emulation is not a device, and
   this session was entirely about the things emulation nearly hid.

## Previous status (session 11)

**All fifty parts Adesh asked for are built.** 126 parts in stock, every one tested as a React + Tailwind
file and as plain HTML, CSS and JavaScript, across chromium, WebKit and an emulated iPhone. The site is
five pages now rather than one long one.

### How Adesh can test
```
cd C:\Users\shukl\OneDrive\Desktop\build-components
pnpm dev
```
Open http://localhost:3000.
- **Home:** the board hero, four parts to try in one socket, a catalogue teaser, the three drawn diagrams,
  the test report.
- **`/parts`:** the whole catalogue. Search it and watch the address bar — a filtered list can be sent to
  someone, and arrives already applied.
- **`/in-use`:** three whole screens made out of the catalogue. Turn on **X-ray** and every part is outlined
  and named, each label a link to that part.
- **`/tested`:** press **Number the tab stops** and compare the menu bar (one stop for nine items) with the
  address block (one per field). Then pick a colour that fails contrast and watch the correction.
- **`/start`:** the two ways to take a part, and what a project needs for each output.
- **Any part page:** configure on the left, the test bench in the middle, the keyboard map and manual
  checklist under it, install command and code below.

### The fifty, finished (sessions 10 and 11)
| Batch | Parts |
|---|---|
| H-K (session 10) | checkbox group, radio cards, textarea with counter, select field, FAQ, details list, comparison table, hero, feature grid, how it works, newsletter, toggle group, value with unit, masked input |
| L | date range, time range, dual range slider, PIN pad, autosaving field, form error summary, address fields |
| M | skip links, anchor navigation, command menu, menu bar, cursor pagination, navigation progress, shrinking sticky header, hover card |
| N | bottom sheet, loading button, undo snackbar, inline confirm, circular progress, error state with retry, maintenance notice, help hint |
| O | changelog, notification list, list with row actions, order tracker, invoice summary, article card, author byline, image gallery, click-to-load video, pull quote, team grid, logo wall |
| P | page header, split feature, stat comparison |

### Bugs found by the tests this session (D63-D66)
Each of these would have shipped:
1. **A sticky header that shrinks fought itself.** Shrinking shortens the content above it, so the browser
   nudges the scroll position to keep the view still — and read as direction, those nudges say "up", which
   brought the header back the instant it hid.
2. **A `display` declaration beats `[hidden]`.** The command menu's filtered-out options and the whole hover
   card stayed on screen in the plain output. Tailwind's preflight hides the React output's, which is why
   only one side was wrong.
3. **`display: flex` on a `<dialog>`** beats `dialog:not([open]) { display: none }`, so the closed bottom
   sheet sat on the page.
4. **A "hidden" skip link was a 32x44 box:** with `border-box`, padding wins over `width: 1px`.
5. **The anchor nav marked the wrong section** (a line at 35% of the viewport is already above the second
   heading before anything is scrolled) **and never the last one.**
6. **A URL option could never be cleared:** `safeUrl` turned `""` into `"#"`, so a dozen "leave it empty for
   none" options were impossible to set.
7. **Six of this session's parts hard-coded an element id,** which collides the moment two of them share a
   page.
8. **My own tab-order tracer counted three stops for a menubar that has one** — `button` matches a button
   with `tabindex="-1"`, which is exactly what a roving tabindex puts it on.
9. **A row of small links on `/in-use` was under the 24px minimum target size** on a phone (WCAG 2.5.8).

Two test-infrastructure fixes as well: `animation.finished` rejects when an animation is interrupted, which
failed the whole animation wait in `expectNoAxeViolations`; and the new pages needed a `data-ready` marker,
because typing into a field before React has hydrated types into nothing.

### Test state
- Batch L: green on all three browsers. Batch M: 408 tests green. Batch N: 438 green. Batches O and P: 747
  green. The four new pages: 63 green.
- `e2e/editor.spec.ts` (every part, both outputs, in the real editor) and `e2e/home.spec.ts` are green. One
  modal editor test failed once with an empty frame and passed on a rerun — the known dev-server artefact.
- **The full sweep across every spec has not been run end to end this session.** Each batch and each suite is
  green on its own; that is the one piece of verification still outstanding.

### Still to do — doesn't need Adesh
- **Hard-coded ids in about twenty older parts** (cart, cta, feature-grid, form, hero, how-it-works,
  mega-menu, menu, multi-select, otp, password, popover, search and others). Each breaks if two of that part
  share a page, which `/in-use` now makes an ordinary thing to do. `useId()` in each, and a test that renders
  two of one part and checks for duplicate ids.
- **Run the whole sweep** (about 5,500 tests now) in one go, and against a production build.
- A "copy all files" button for the HTML/CSS/JS output.
- Configurable UI strings for the date picker and select.
- Screen-reader pass (NVDA) on the parts added this session, then fold anything learnt into the checklists.

### Needs Adesh
1. **A licence for the exported code.** `/start` says `[TODO: no licence has been chosen]` rather than
   implying one. MIT is the usual choice; it is your call, and until it is made the page is honest but
   unhelpful.
2. **Deploy.** Nothing has been pushed. The live site is still on the state from session 10 — 88 parts, one
   long home page.
3. **Manual checks:** the checklists with NVDA and on a real iPhone. Emulation is not a device.
4. The Mitosis / Web Components question (D6) is still open. 126 parts in two hand-written outputs each is
   the cost a third output would multiply.

---

## Current status (session 10)

### How Adesh can test
```
cd C:\Users\shukl\OneDrive\Desktop\build-components
pnpm dev
```
Open http://localhost:3000.
- **Home:** the board hero with three live parts mounted on it, the catalogue (every part in stock), how it works, and the test report.
- **Theme:** the System / Light / Dark control sits in the header and is remembered per browser.
- **Any part page:** Configure on the left (tabs with changed counts, plus a search across every option), the test bench in the middle (React + Tailwind or HTML/CSS/JS, phone/tablet/desktop), the keyboard map and manual checklist under it, and the install command and code below.
- **Each component's own Theme option** (Style tab) previews light, dark or "follow the device".
- **iPhone look:** open any part page on an iPhone (or in Safari's responsive mode with an iPhone user agent) to see the iOS treatment.

### The eighty-eight parts, all in stock
| Name | Component | Pattern |
|---|---|---|
| **Almanac** | Date picker | APG Date Picker Dialog |
| **Porthole** | Modal | APG Dialog (Modal) |
| **Sextant** | Searchable select | APG Combobox |
| **Logbook** | Form with validation | Native form + error summary |
| **Masthead** | Site header | APG Disclosure navigation |
| **Compass** | Tabs | APG Tabs |
| **Keel** | Site footer | Landmark contentinfo |
| **Beacon** | CTA section | Landmark section |
| **Cargo** | Basket | Native dialog + live totals |
| **Chartroom** | Mega menu | APG Disclosure navigation |
| **Capstan** | Carousel | APG Carousel |
| **Bellows** | Accordion | APG Accordion |
| **Pennant** | Tooltip | APG Tooltip |
| **Helm** | Dropdown menu | APG Menu Button |
| **Spyglass** | Popover | Anchored dialog |
| **Klaxon** | Notifications | ARIA live region |
| **Manifest** | Data table | HTML table + aria-sort |
| **Ladder** | Pagination | Navigation + aria-current |
| **Wake** | Breadcrumbs | Navigation + aria-current |
| **Course** | Stepper | Navigation + aria-current=step |
| **Gangway** | Sidebar navigation | Navigation + disclosure |
| **Hoist** | File upload | File input + drop area |
| **Trawl** | Multi-select | APG Combobox, multi-select |
| **Cipher** | Password field | Labelled input + live rules |
| **Semaphore** | One-time code | Grouped inputs + one-time-code |
| **Fathom** | Range slider | Native range inputs |
| **Lookout** | Global search | APG Combobox in a dialog |
| **Chronometer** | Time picker | APG Combobox (editable) |
| **Rigging** | Tree view | APG Tree View |
| **Muster** | Sortable list | Toggle-button handles + live region |
| **Hatch** | Drawer | APG Dialog (Modal) |
| **Customs** | Cookie consent | Landmark region + dialog |
| **Purser** | Card payment fields | Native form + autocomplete cc-* |
| **Pilot** | Guided tour | Non-modal dialog steps |
| **Current** | Load-more feed | APG Feed |
| **Lantern** | Lightbox | APG Dialog (Modal) gallery |
| **Bulkhead** | Resizable panels | APG Window Splitter |
| **Seacock** | Switch | Checkbox with role=switch |
| **Sounding** | Rating | Radio group / image |
| **Tiller** | Segmented control | Radio group |
| **Ensign** | Alert banner | role=alert / role=status |
| **Shroud** | Skeleton | role=status + hidden shapes |
| **Doldrums** | Empty state | Heading + actions |
| **Crew** | Avatar group | Labelled list of images |
| **Burgee** | Badges | List of labelled pills |

| **Netting** | Tag input | Field + labelled chip list |
| **Winch** | Quantity stepper | Number input + buttons |
| **Doubloon** | Currency input | Text input + hidden value |
| **Hailer** | Phone input | Select + tel input |
| **Quill** | Inline edit | Button to field, with focus moves |
| **Pigment** | Colour picker | Radio group + native colour input |
| **Windlass** | Back to top | Button + focus move |
| **Logline** | Reading progress | role=progressbar + aria-current |
| **Parley** | Language switcher | Disclosure + links |
| **Sieve** | Filter bar | Toggle buttons + status |
| **Ledger** | Data grid | Table + sort + resize |
| **Bosun** | Kanban board | Board + move buttons |
| **Bulwark** | Typed confirmation | Modal dialog + guard |
| **Hourglass** | Session timeout | Timed modal dialog |
| **Ledgerlock** | Unsaved changes guard | Dirty state + dialog |
| **Foghorn** | Offline banner | Network status region |
| **Keyring** | Shortcut help | Modal dialog + hotkey |
| **Tariff** | Pricing table | Radio group + cards |
| **Cross-staff** | Stats tiles | Description list |
| **Watchlog** | Activity timeline | Ordered list + reveal |
| **Wardroom** | Comment thread | List + form |
| **Chandler** | Product card | Fieldsets + guarded action |
| **Inkwell** | Signature pad | Canvas + typed alternative |
| **Cipherstone** | Code block | Clipboard + status |
| **Binnacle** | Toolbar | APG toolbar |
| **Glass** | Countdown | Timer + polite status |
| **Berth** | Booking slots | Grouped radio group |
| **Coxswain** | Multi-step wizard | Steps + per-step validation |

### Session 10, part 2 (2026-09-27): the home page performs its own idea (D61)
Adesh asked for a home page that is more spacious, fresher and more interactive, with motion graphics, using the design skills already installed. Run through the `impeccable` skill against the project's own DESIGN.md world rather than a new look. He chose motion graphics over video, at full strength.

- **Hero:** one part, set down once — traces draw, pads take current, and the mounted component is uncovered from its top edge at 280ms. That is the page's single authored moment; nothing else on the page uses the same entrance.
- **New section, "Try them here first":** four real exported components in one socket (date picker, searchable select, switch, rating) as a WAI-ARIA tablist with a gold pad marking what is live. It advances itself every nine seconds and stops on pointer, on focus, when off screen, and under reduced motion. Arrows, Home and End move it.
- **How it works:** three drawn SVG diagrams — an options panel filling in, a bench with the keyboard path traced across it, a file leaving — replacing three same-size number-heading-text cards. Each draws once, on arrival.
- **Spacing** moved to a clamp rhythm throughout; heading and body sizes up a step.
- **Two-theme colour:** the diagrams use the `link` token (purple on paper, gold on ink) so they read in both themes. Reduced motion gets the finished state, never a blank one.
- No new dependency: CSS keyframes, SVG and IntersectionObserver.

**Two test-infrastructure bugs found doing it,** both fixed: `expectNoAxeViolations` waited for ever on scroll-driven animations (they only finish when the scrolling does), and a Tab assertion in `home.spec.ts` was checking that no preview was open rather than that focus had gone to the next card instead of into the frame. The home page itself is now axe-checked, and the reel has keyboard and hold-while-in-use tests.

### Session 10, part 3 (2026-09-27): fourteen of the fifty new parts
Batches H to K: checkbox group, radio cards, textarea with counter, select field · FAQ, details list, comparison table · hero, feature grid, how it works, newsletter signup · toggle group, value with unit, masked input. All green across chromium, WebKit and the emulated iPhone.

**Still to come from the fifty** (36 parts): date range and time range fields, dual range slider, PIN pad, autosaving field, form error summary, address fields · skip links, anchor navigation, command menu, menu bar, cursor pagination, navigation progress, shrinking sticky header, hover card · bottom sheet, loading button, undo snackbar, inline confirm, circular progress, error state with retry, maintenance notice, help hint · changelog, notification list, list with row actions, order tracker, invoice summary, article card, author byline, image gallery, click-to-load video embed, pull quote, team grid, logo wall · page header, split feature, stat comparison.

### Session 10 (2026-09-27): plain names, a searchable catalogue, and the first eleven of fifty new parts (D57-D60)
Adesh asked for three things: names a developer or a layman could understand, fifty more components with more options each, and a cleaner, more interactive site.

- **Names (D57):** the ship-themed codenames are gone. Nobody outside this repo could tell what a "Binnacle" or a "Ledgerlock" was, and every card led with the joke instead of the component. Cards, part pages, the editor and the home page now lead with the plain name, and the card's second line is the pattern. Twenty-six parts were also renamed to the term people search for: Basket → Shopping cart, One-time code → OTP input, Load-more feed → Infinite feed, Typed confirmation → Confirm dialog, Booking slots → Time slot picker, and so on.
- **Catalogue search (D58):** eighty-four parts is too many to scan. There is now a search box matching name, summary, pattern, category and slug (so "color" finds the colour picker and "dialog" finds every dialog), type filters with live counts that disable when they would show nothing, "/" to jump to the box, a polite result count, and a way out when nothing matches. Preview frames are lazy now, so the page no longer warms up eight iframes.
- **New parts, first eleven of fifty (D59, D60):** checkbox group, radio cards, textarea with counter, select field, FAQ, details list, comparison table, hero section, feature grid, how it works, newsletter signup. Every one has ten to fourteen options, both outputs, docs, a hover demo and its own spec; all green in chromium, WebKit and the emulated iPhone.

**Still to come from Adesh's fifty** (39 parts, in this order): date range and time range fields, dual range slider, PIN pad, autosaving field, form error summary, address fields, masked input, value with unit, toggle group · skip links, anchor navigation, command menu, menu bar, cursor pagination, navigation progress, shrinking sticky header, hover card · bottom sheet, loading button, undo snackbar, inline confirm, circular progress, error state with retry, maintenance notice, help hint · changelog, notification list, list with row actions, order tracker, invoice summary, article card, author byline, image gallery, click-to-load video embed, pull quote, team grid, logo wall · page header, split feature, stat comparison.

**Test note:** the full 4,000-test sweep has not been re-run since the rename; each batch is green across the three browsers, and `e2e/editor.spec.ts` + `e2e/home.spec.ts` (every part, both outputs, every hover preview) were green against a production build earlier in the session.

### Session 9, part 2 (2026-09-25): twenty-eight more parts, batches B to G (D50-D55)
Adesh asked for at least thirty more parts, the everyday ones and the ones that are hard to find done properly. Twenty-eight arrived in this half of the session (thirty-six counting Batch A), each with both outputs, a schema, a keyboard map, a manual checklist, a hover demo and its own cross-browser spec.

- **Batch B — fields people actually need (D50):** tag input, quantity stepper, currency input, phone input, inline edit, colour picker.
- **Batch C — the awkward ones (D51):** back to top, reading progress, language switcher, filter bar, data grid (frozen header, sortable columns, columns that resize by arrow key), kanban board (cards that move by button, not only by drag).
- **Batch D — the guards nobody ships in time (D52):** typed confirmation, session timeout, unsaved changes guard, offline banner, shortcut help.
- **Batch E — the sections every product site needs (D53):** pricing table, stats tiles, activity timeline, comment thread, product card with variants.
- **Batch F — the fiddly four (D54):** signature pad, countdown, code block, toolbar.
- **Batch G — the two flows (D55):** booking slots, multi-step wizard.

Bugs found and fixed along the way, each of which would have shipped:
- **Reading progress never marked the last section.** At the bottom of a page the final heading can still sit below the line, so nothing was ever current. It now marks the last one once there is no more to scroll.
- **The data grid's scrolling wrapper could not be scrolled without a pointer** (axe `scrollable-region-focusable` on the phone). It takes focus now and is named by the caption.
- **Safari would not hand focus back from three dialogs.** Safari does not focus a button when it is clicked, so "where focus came from" has to be passed in rather than read from `document.activeElement`; and focus cannot leave a modal dialog that is still open, so the dialog is closed before focus is moved.
- **The offline banner was fixed to the top** and covered the page on a phone. It is sticky now, so it keeps its own space.
- **Two headings read as "To do(2)" and "Comments(3)"** because the count was spaced with a margin. The space is part of the text now.
- **The wizard's plain script rewrote the wrong element:** `data-title` and `data-label` matched the step list before the heading. Its step data attributes are prefixed now.
- **Seven new parts had borrowed a codename** already in use, which collided two test titles.

Verified: the full suite across chromium, WebKit and an emulated iPhone, plus `e2e/editor.spec.ts` (every part in the real editor, both outputs, no console errors) and `e2e/home.spec.ts` (every part has its hover explanation). A production build was made and the editor and home suites were run against it as well: 77 passing, and none of the dev-server noise (see the gotcha below).

**New gotcha:** under a full test run the dev server occasionally answers one page with a truncated payload — the browser reports `Uncaught SyntaxError: Unexpected end of JSON input` and that page renders empty. It is a dev-only artefact: the same suites pass cleanly against `next build && next start`. If a single editor test fails with an empty frame, rerun it before believing it.

### Session 9 (2026-09-25): live card previews and Batch A (D48, D49)
- **Hover previews (D48):** every catalogue card now opens a panel running the real exported React output in a frame, plays a short script of the part being used, and says in one line how it works. `lib/demos.ts` holds both. The panel is inert, so the frame can never trap focus, and the script does not run for anyone asking for less motion. `e2e/home.spec.ts` keeps every part supplied with an explanation.
- **Batch A, eight everyday primitives (D49):** Seacock (switch), Sounding (rating), Tiller (segmented control), Ensign (alert banner), Shroud (skeleton), Doldrums (empty state), Crew (avatar group), Burgee (badges). New **Feedback** category in the catalogue filters.
- **Harness bug found:** the axe helper waited for *every* animation to finish, so it hung forever on an endless one (the skeleton's pulse). It now skips endless animations.
- Batch A: 357 tests passing across the three browsers.

### Session 8, part 3 (2026-09-22): parity audit and Tier 2 (D46, D47)
- **What Adesh reported:** the cookie banner's HTML/JS preview could not save from Choose cookies ("Blocked form submission ... 'allow-forms' permission is not set"), and the two outputs looked different in places.
- **Why the tests missed it:** the component tests load the HTML/JS files directly, never through the editor's sandboxed frame. `e2e/editor.spec.ts` now opens every part in the real editor, in both outputs, and fails on any console error; it also saves cookie choices inside the sandboxed frame.
- **Parity audit** (every part, both outputs, desktop and phone, closed and opened; accessibility trees diffed, screenshots side by side). Found and fixed:
  1. Preview frame blocked forms (`sandbox` now `allow-scripts allow-forms`, still no shared origin).
  2. HTML/JS frame stuck at 480px, cutting off the form and basket; it now reports its content height and grows like the React one.
  3. Full-width parts (header, footer, CTA, mega menu) had 32px of padding only in the HTML/JS preview; padding now matches React at every width.
  4. React preview borrowed the site's Geist font; both previews now use the system font the HTML/JS output declares.
  5. Line height: React got 1.5 from Tailwind's reset, HTML/JS got the browser's ~1.2, so every HTML/JS part was tighter. All 37 stylesheets now set 1.5.
  6. Table on a phone (React): caption a word per line and values right-aligned; now stacks like the HTML/JS output.
  7. Basket progress bar: green in one output, blue in the other; now drawn explicitly in both.
  8. Upload (HTML/JS): an empty file list was exposed to screen readers (`display: flex` beat `hidden`).
  9. Multi-select (HTML/JS): did not announce the option count on opening.
  10. Cookie consent (HTML/JS): after saving, focus fell to the page because the browser returns focus to the dialog's opener on close; focus now moves after the dialog closes.
  11. Preview body scrolled 64px inside its frame (`content-box` + `min-height: 100dvh` + padding).
- **Five Tier 2 parts**, each with both outputs, docs, a registry entry and tests: Purser (card fields), Pilot (guided tour), Current (feed), Lantern (lightbox), Bulkhead (resizable panels).
- **Real bugs the new tests caught:** submitting the card form after fixing an error missed the Pay button, because the error vanished on blur and the button jumped up mid-click (errors now clear as you type); the lightbox's enlarged picture rendered at zero size in HTML/JS (and small in React); the tour's demo search squeezed to a sliver on a phone.

### Session 8, part 2 (2026-09-22): catalogue and Tier 1 (D44, D45)
- **Shorter home page:** the catalogue is a grid of compact cards with type filters (Inputs, Navigation, Overlays, Content, Page sections). "All" shows 8 with a "Show all" button. The section went from about 3,000px to 924px at 800px wide.
- **Bug found:** the live parts in the hero sat on a chip that turned dark in dark mode while the parts stayed light, so their labels were near-black on near-black. The chip is now always white.
- **Five Tier 1 parts**, each with both outputs, docs, a registry entry and its own tests:
  - **Chronometer** (time picker): type 2pm, 14, 1430 or 2:30 pm, or pick from a list. Times between the listed slots are kept, and times outside the allowed hours are explained.
  - **Rigging** (tree view): the full APG keyboard model, including type-ahead and `*`. Built from plain paths (`src/app/page.tsx`), so the editor stays a flat list.
  - **Muster** (sortable list): drag, keyboard pick-up (Space, arrows, Escape to cancel), and move buttons as the no-drag alternative WCAG 2.2 requires. Every move is announced.
  - **Hatch** (drawer): right, left or bottom, on a native modal dialog, with swipe to close on touch.
  - **Customs** (cookie consent): non-modal banner, Accept and Reject styled the same, nothing pre-ticked, per-category preferences and a Cookie settings button. The choice is saved to localStorage and broadcast as an event. It handles the choice, not the cookies; the checklist says so.
- **Real bugs the tests caught:** the cookie policy link was 23px tall (under the 24px minimum); dragging in Safari dropped items one place short, because pointer events arrived faster than re-renders.

### Done in session 4 (2026-09-18)
- **Fixed what Adesh reported:**
  - Text cursor over calendar days and months (the calendar no longer selects text).
  - The React preview escaping its box: both outputs now run in a frame, so dialogs stay inside the test bench (D24).
  - Part numbers replaced with real names (D23).
  - Navigation and footer no longer list every component (D28).
- **Light / dark:** site-wide control in the header, plus a `theme` option on every component that can follow the device (D25).
- **iPhone look:** `iosOnPhone` on the date picker, modal and select — Apple system font, iOS blue, 44px rows, bottom sheets (D26).
- **Three new components:** Sextant (searchable select), Logbook (form with validation), Beacon (CTA section), plus Masthead (site header). Each with both outputs, a registry entry, an editor page, a keyboard map, a checklist and its own tests.
- **New option types:** `list` (repeatable items such as select options and header links, with add/remove/reorder in the editor) and URL-safe text, so a shared link can never inject a `javascript:` URL.
- **HTML-first outputs:** the CTA, form and header generate their markup from the options; the CTA ships no JavaScript at all (D27).
- **Real bugs the tests caught this session:**
  1. iOS blue as text is 3.9:1 on white — a WCAG failure. Every accent used as text is now contrast-corrected first.
  2. Safari does not focus a button when it is tapped, so Escape never closed the header menu there. Both outputs now listen on the document.
  3. The form's error-summary links were under the 24px minimum target size (WCAG 2.2 AA).
- **Test-side fixes:** tests now wait for React hydration before typing, and locators no longer collide with Next's route announcer.
- **Dark mode in the test bench:** the preview frame now opens with the page's own options and waits until it is listening, so a component opened with `theme=dark` is dark on first paint. Interactive text uses a theme-aware link colour that stays readable in both themes.
- **Two more parts (D29):** **Compass** (tabs — arrow keys, Home/End, automatic or manual activation, row or side) and **Keel** (site footer — links, social profiles, legal line, no JavaScript). Both outputs, registry entry, editor page, keyboard map, checklist and tests each.
- **Test count:** 256 passing, 2 skipped, across Chromium, WebKit and an emulated iPhone. Production build green.

### Done in session 5 (2026-09-20)
- **Fixed what Adesh reported:** both outputs now open at the same height in the test bench and fill their frame (D31), and a component opened with `theme=dark` is dark on first paint.
- **Three parts that are hard to build by hand (D30):**
  - **Cargo** (basket): quantity steppers, removing a line, delivery with a free-delivery progress bar, totals that add up, as a panel or a drawer. Every change is announced once, politely, with the new subtotal.
  - **Chartroom** (mega menu): flat rows in the editor (menu, column, link, description) become grouped panels. Click or hover opens; Escape, outside clicks and picking a link close.
  - **Capstan** (carousel): a scroll-snap row that swipes on a phone, with previous/next, dots, a counter and optional rotation that pauses and never runs under reduced motion.
- **Real bugs the tests caught:** carousel dots under the 24px minimum target size; last-slide maths that ignored how many slides are on screen; a mega-menu panel covering the next row of a wrapped bar on a phone.
- **Test count:** 385 passing, 2 skipped, across Chromium, WebKit and an emulated iPhone. Production build green.

### Done in session 6 (2026-09-20)
- **Fixed what Adesh reported:**
  - **Form:** rebuilt as a field list with real validation controls (D32) — type, required, min, max, custom pattern, choices, hint; checking on blur, on input or on submit.
  - **Mega menu:** below the breakpoint the bar becomes a menu button and each menu opens as its own step, with a back button. Escape steps back, then closes.
  - **Carousel:** a repeat option that wraps at both ends, and controls that respond to hover and press.
  - **CTA:** an eyebrow, three looks (plain, card, bold gradient panel), a split layout and larger display type.
  - **The site:** one header row on a phone with the theme control inside the menu, the test bench before the options panel on small screens, tighter spacing and type everywhere, and a counted strip in the hero.
- **Refactor (D33):** one page for every part; `lib/registry.ts` is the single entry point per component.
- **Five new parts (D34):** Bellows, Pennant, Helm, Spyglass, Klaxon.
- **Real bugs the tests caught:** menu focus racing a fast keypress; a notification pinned open for ever by an emulated hover after a tap; the CTA eyebrow failing contrast as a tinted pill; carousel dots under the minimum target size.
- **Test count:** 634 passing, 2 skipped. Production build green.

### Session 8 (2026-09-22): production readiness (D41-D43)
- **Moved** to `C:\Users\shukl\OneDrive\Desktop\build-components`. The old `C:\dev` folder was deleted at Adesh's request.
- **Name and address:** Build Components, at `build-components.devstash.me`, part of devstash.me (D41). Not deployed yet.
- **Favicon:** the create-next-app Vercel favicon is gone. `app/icon.svg` is the chip mark in the board colours.
- **Security audit:** no vulnerabilities found. Options from links are validated, frame messages check their origin, the HTML preview is sandboxed, and exported JS sets text with `textContent`. Added a CSP and security headers, removed `X-Powered-By`, and stopped shipping the internal design-direction comment in every page (D42).
- **Content audit:** no copied text, no third-party images, no invented numbers. Brand names appear only as footer link labels (GitHub, LinkedIn). Fonts are OFL (Geist, Barlow Condensed), self-hosted by next/font.
- **SEO:** metadataBase, title template, a description and canonical URL per part (query-string options canonicalise to the plain page), an Open Graph image, `sitemap.xml` and `robots.txt`.
- **New pages (D43):** About, an accessibility statement, and a 404 inside the site chrome. The header and footer link to them.
- **Deploy safety:** `outputFileTracingIncludes` ships `/registry` with the server functions, because part pages and `/r/*` read it at request time.
- **Checked:** every sitemap page returns 200 on `next start` with no console errors under the CSP, and the sandboxed HTML/CSS/JS preview runs on all 27 part pages.

### Audit round (2026-09-21)
Adesh was right that the tests proved behaviour and never looked at the result. A sweep of all sixteen parts, both outputs, at 375, 768 and 1280, in their closed and open states, found:
- **Vanilla exports had no `box-sizing` of their own**, so on any page without a CSS reset a full-width field overflowed. Every component now sets it, scoped to itself.
- **Five targets under the 24px minimum**: footer links, the basket's remove button, the form checkbox, the notification action, the header logo.
- **Three components fell back to Times** on a plain HTML page: the searchable select, date picker and modal used `font: inherit`.
- **The mega menu's step chevron had no size**, so on a phone the plain-JS output showed a giant arrow per row.
- **The form's two columns did not line up** and every problem was said twice.
All fixed. `e2e/layout.spec.ts` now runs those checks on every component, in both outputs, at three widths (D37), so none of it can come back quietly. 928 tests passing.

### Still to build
- Nothing queued. Seventy-three parts are in stock; the batches Adesh asked for (A to G) are all done.
- Ideas not started: audio or video player (needs a hosted media file, which the CSP would have to allow), before/after image compare, charts (would need real data, not invented numbers).

### In progress
Nothing half-finished.

### Next — doesn't need Adesh
- Screen-reader pass on the three new components (NVDA), then fold anything learnt into the checklists.
- Configurable UI strings for the date picker and select (button labels, error messages).
- A "copy all files" button for the HTML/CSS/JS output.

### Next — needs Adesh's answers first
- Components beyond these eleven (tooltip, lazy loading, pagination, table, toast, or something else): which ones, in what order?
- The Mitosis / Web Components question (D6) is still open. Eleven components now exist in two hand-written outputs each; that is the cost a third output would multiply.

### Blockers & questions for Adesh
1. **Licence** for the exported code: users copy it into their projects, so the site should say what they may do with it (MIT is the usual choice). Not chosen yet.
2. **Next components**: the basket, mega menu and slider are done. Tooltip, lazy loading, pagination, data table, toast — which next?
3. **Tailwind v4 only** for the React output?
4. **Deploy:** a Vercel project plus a `build-components` CNAME on devstash.me. Adesh deploys; nothing goes to production from here until he says "ship".
5. **Manual checks**: please run the checklists with NVDA and on a real iPhone. Emulation is not a real device.

---

## Session 3 record (history)

Redesign to the "Parts Datasheet" world, the organised editor, the date picker's month and year views, and WebKit/iPhone test runs. See `docs/DECISIONS.md` (D19–D22) and `DESIGN.md`.

## Session 2 record (history)

The shared editor and test UI, the date picker's form values and date limits, and the modal. See D16–D18.

## Session 1 record (history)

Repo, docs, and the date picker feasibility spike: schema → editor → preview → both exports → tests. The honest finding was that behaviour is written once per output; only configuration is single-source. That still holds with six components.
