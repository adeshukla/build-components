# Progress

Last updated: 2026-09-22 (session 8)

## Current status (session 8)

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

### The forty-five parts, all in stock
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

### Still to build (D45 order)
- **Tier 3 (quick wins):** switch · rating · alert banner · skeleton · empty state · avatar group · segmented toggle.
- **Later:** a kanban board on top of Muster.
- **Moved down:** pricing table, stats, timeline (page sections with little accessibility work in them).

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
