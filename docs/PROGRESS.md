# Progress

Last updated: 2026-09-20 (session 5)

## Current status (session 5)

### How Adesh can test
```
cd C:\dev\component-platform
pnpm dev
```
Open http://localhost:3000.
- **Home:** the board hero with three live parts mounted on it, the catalogue (all eleven parts), how it works, and the test report.
- **Theme:** the System / Light / Dark control sits in the header and is remembered per browser.
- **Any part page:** Configure on the left (tabs with changed counts, plus a search across every option), the test bench in the middle (React + Tailwind or HTML/CSS/JS, phone/tablet/desktop), the keyboard map and manual checklist under it, and the install command and code below.
- **Each component's own Theme option** (Style tab) previews light, dark or "follow the device".
- **iPhone look:** open any part page on an iPhone (or in Safari's responsive mode with an iPhone user agent) to see the iOS treatment.

### The eleven parts, all in stock
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
1. **Final name**: "Build Components" is still the logo only. Make it the product name everywhere?
2. **Next components**: the basket, mega menu and slider are done. Tooltip, lazy loading, pagination, data table, toast — which next?
3. **Tailwind v4 only** for the React output?
4. **Private GitHub repo?** Still no remote, so no backup and no CI.
5. **Manual checks**: please run the checklists with NVDA and on a real iPhone. Emulation is not a real device.

---

## Session 3 record (history)

Redesign to the "Parts Datasheet" world, the organised editor, the date picker's month and year views, and WebKit/iPhone test runs. See `docs/DECISIONS.md` (D19–D22) and `DESIGN.md`.

## Session 2 record (history)

The shared editor and test UI, the date picker's form values and date limits, and the modal. See D16–D18.

## Session 1 record (history)

Repo, docs, and the date picker feasibility spike: schema → editor → preview → both exports → tests. The honest finding was that behaviour is written once per output; only configuration is single-source. That still holds with six components.
