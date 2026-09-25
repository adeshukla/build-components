/**
 * What each part does, in one line, and a short script that shows it being used.
 * The catalogue cards run these against the real exported React output in a frame, so a preview
 * is never a picture or a mock-up: it is the component people will take home.
 *
 * A step finds an element by CSS selector inside the preview and does one thing to it. With no
 * steps, the preview just sits there (nothing to demonstrate) or opens whatever opens.
 */
export type DemoStep = {
  /** CSS selector inside the preview. The first match is used. */
  find: string;
  action: "click" | "type" | "key";
  /** Text to type, or the key to press (e.g. "ArrowDown", "Enter"). */
  value?: string;
  /** Milliseconds to wait after this step. Default 700. */
  after?: number;
};

export type Demo = {
  /** One sentence: what the part does and how it behaves. */
  how: string;
  steps?: DemoStep[];
};

/** Opens whatever the part opens: used when a part has no script of its own. */
const OPENER = '[aria-haspopup]:not([hidden]), [aria-expanded="false"]';
const open = (after = 1600): DemoStep[] => [{ find: OPENER, action: "click", after }];

export const demos: Record<string, Demo> = {
  "tag-input": {
    how: "Type and press Enter to add a tag; each chip has its own “Remove CSS” button, and every change is announced.",
    steps: [
      { find: "input[type=text]", action: "type", value: "Testing", after: 400 },
      { find: "input[type=text]", action: "key", value: "Enter", after: 1400 },
    ],
  },
  quantity: {
    how: "Minus and plus around a real number field: the new amount is announced, and the limits are said in words.",
    steps: [
      { find: "button[aria-label^=More]", action: "click", after: 700 },
      { find: "button[aria-label^=More]", action: "click", after: 1400 },
    ],
  },
  "currency-input": {
    how: "Type the amount however you like; it is tidied when you leave the field, and your server gets a plain number.",
    steps: [
      { find: "input[inputmode=decimal]", action: "type", value: "4999.5", after: 400 },
      { find: "input[inputmode=decimal]", action: "key", value: "Tab", after: 1400 },
    ],
  },
  "phone-input": {
    how: "Pick a country, then type: digits are grouped the way that country writes them, and one full number is submitted.",
    steps: [{ find: "input[type=tel]", action: "type", value: "7700900123", after: 1600 }],
  },
  "inline-edit": {
    how: "Click the value to edit it in place: Enter saves, Escape cancels, and focus returns to where it started.",
    steps: [
      { find: "button", action: "click", after: 800 },
      { find: "input[type=text], textarea", action: "type", value: " v2", after: 800 },
      { find: "button", action: "click", after: 1400 },
    ],
  },
  "color-picker": {
    how: "Named swatches in one radio group — arrow keys pick, and the choice is announced by name, not just by hex.",
    steps: [{ find: "input[type=radio]:not(:checked)", action: "click", after: 1400 }],
  },
  "back-to-top": {
    how: "Appears once you have scrolled far enough, and moves focus to the top as well as the page — scrolling alone would strand a keyboard user.",
  },
  "reading-progress": {
    how: "A bar for how far you have read, plus a contents list that marks the section you are in with aria-current.",
  },
  "language-switcher": {
    how: "Each language written in its own language, as a real link with lang and hreflang; Escape closes and returns focus.",
    steps: [{ find: "button[aria-expanded=false]", action: "click", after: 1600 }],
  },
  switch: {
    how: "An on/off control on a real checkbox: Space flips it, and the state is said in words as well as shown.",
    steps: [{ find: "input[role=switch]", action: "click", after: 1400 }],
  },
  rating: {
    how: "Stars as radio buttons: arrow keys move and pick, and each one reads as “3 stars, 3 of 5”.",
    steps: [{ find: ".ra-pick:nth-child(5) input, label:nth-child(5) input[type=radio]", action: "click", after: 1400 }],
  },
  segmented: {
    how: "A few choices side by side on radios, so one Tab stop enters the group and arrow keys pick.",
    steps: [{ find: "input[type=radio]:not(:checked)", action: "click", after: 1400 }],
  },
  "alert-banner": {
    how: "An inline message that says its tone first (“Warning:”), with an action and a dismiss that never strands focus.",
    steps: [{ find: "button[aria-label^=Dismiss]", action: "click", after: 1600 }],
  },
  skeleton: {
    how: "Placeholder shapes while content loads, announced once as “Loading comments” instead of a wall of empty boxes.",
  },
  "empty-state": {
    how: "Nothing to show, said calmly: what happened, and the one thing to do next.",
  },
  "avatar-group": {
    how: "Faces or initials with the extra people named in the “+3” circle, so nobody is hidden behind a number.",
  },
  badge: {
    how: "Status pills where the words carry the meaning; the colour and dot only repeat it.",
  },
  "date-picker": {
    how: "Type a date or pick one in the calendar. Arrow keys move day by day, and the month is announced as it changes.",
    steps: [
      { find: "[data-open], button[aria-haspopup]", action: "click", after: 900 },
      { find: "dialog [role=grid] button:not([disabled])", action: "key", value: "ArrowDown", after: 500 },
      { find: "dialog [role=grid] button:not([disabled])", action: "key", value: "ArrowRight", after: 900 },
    ],
  },
  modal: {
    how: "A dialog that keeps focus inside, closes on Escape and hands focus back to the button that opened it.",
    steps: open(),
  },
  "searchable-select": {
    how: "Type to filter a long list; matches are highlighted and the count is announced as you narrow it.",
    steps: [
      { find: "input[role=combobox]", action: "click", after: 500 },
      { find: "input[role=combobox]", action: "type", value: "ger", after: 1400 },
    ],
  },
  form: {
    how: "Native validation with messages next to each field, an error summary you can jump from, and no error shown before you have finished typing.",
    steps: [{ find: "button[type=submit]", action: "click", after: 2000 }],
  },
  header: {
    how: "A site header that collapses into a menu button on small screens, with Escape and outside clicks closing it.",
    steps: open(),
  },
  tabs: {
    how: "Arrow keys move between tabs, Home and End jump to the ends, and only the open panel is in the page.",
    steps: [
      { find: "[role=tab]:not([aria-selected=true])", action: "click", after: 900 },
      { find: "[role=tab][aria-selected=true]", action: "key", value: "ArrowRight", after: 900 },
    ],
  },
  footer: { how: "A footer landmark with link groups, social links and a legal line; no JavaScript at all." },
  cta: { how: "A call-to-action band: heading, supporting line and the actions, in plain HTML with no script." },
  cart: {
    how: "Quantities, removing a line and delivery totals that add up, with every change announced once.",
    steps: [{ find: "[data-increase], button[aria-label^=Increase]", action: "click", after: 1400 }],
  },
  "mega-menu": {
    how: "Wide menu panels on a desktop; on a phone the same links become a two-step menu behind a hamburger.",
    steps: open(),
  },
  carousel: {
    how: "A scroll-snap row that swipes, steps with buttons and dots, and pauses rotation on hover or focus.",
    steps: [{ find: "[data-next], button[aria-label*=Next]", action: "click", after: 1400 }],
  },
  accordion: {
    how: "Headed panels that open one at a time or all at once, each button saying whether it is open.",
    steps: open(),
  },
  tooltip: {
    how: "A short note on hover and on keyboard focus, closing on Escape and never trapping the pointer.",
    steps: [{ find: "[aria-describedby], button", action: "click", after: 1400 }],
  },
  menu: {
    how: "A menu button: arrow keys move, letters jump, Escape closes and focus returns to the button.",
    steps: [
      { find: "button[aria-haspopup=menu], button[aria-haspopup=true]", action: "click", after: 900 },
      { find: "[role=menuitem]", action: "key", value: "ArrowDown", after: 900 },
    ],
  },
  popover: {
    how: "An anchored panel you can use: focus moves in, Escape closes it and sends focus back.",
    steps: open(),
  },
  toast: {
    how: "Messages that announce themselves politely, stack up, pause on hover and can be dismissed.",
    steps: [{ find: "button", action: "click", after: 2200 }],
  },
  table: {
    how: "Sortable columns with aria-sort, row selection announced as a count, and rows that stack into cards on a phone.",
    steps: [{ find: "th button, th[aria-sort] button", action: "click", after: 1400 }],
  },
  pagination: {
    how: "Numbered pages with gaps, previous and next, and the current page marked with aria-current.",
    steps: [{ find: "a[href]:not([aria-current]), button:not([aria-current])", action: "click", after: 1400 }],
  },
  breadcrumbs: { how: "The trail back up the site, as a navigation landmark, with the current page marked and no link." },
  stepper: { how: "Where you are in a multi-step flow, with each step's state said in words, not only by colour." },
  sidebar: {
    how: "Sections of links that fold away, with the current page marked; on a phone it becomes a drawer.",
    steps: open(),
  },
  upload: {
    how: "Choose or drop files, with the type and size checked, each file listed and every change announced.",
    steps: [],
  },
  "multi-select": {
    how: "Pick several from a long list; each choice becomes a removable chip and the count is announced.",
    steps: [
      { find: "input[role=combobox]", action: "click", after: 700 },
      { find: "[role=option]", action: "click", after: 1400 },
    ],
  },
  password: {
    how: "Rules shown before typing, strength said in words as well as a bar, and a show/hide button that says its state.",
    steps: [{ find: "input", action: "type", value: "Sail1ng", after: 1600 }],
  },
  otp: {
    how: "Boxes that fill as you type, take a pasted code whole, and say when the code is complete.",
    steps: [{ find: "input", action: "type", value: "4821", after: 1600 }],
  },
  slider: {
    how: "One value or a range on native range inputs, so the keyboard and the announcements come from the browser.",
    steps: [
      { find: "input[type=range]", action: "key", value: "ArrowRight", after: 500 },
      { find: "input[type=range]", action: "key", value: "ArrowRight", after: 1200 },
    ],
  },
  search: {
    how: "Point it at any data, nested or flat; ⌘K opens it, every typed word has to match, and matches are marked.",
    steps: [
      { find: "[data-trigger], button[aria-haspopup]", action: "click", after: 800 },
      { find: "dialog input, input[type=search]", action: "type", value: "acc", after: 1600 },
    ],
  },
  "time-picker": {
    how: "Type 2pm, 14, 1430 or 2:30 pm, or pick from the list; times between the listed ones are kept.",
    steps: [{ find: "input[role=combobox]", action: "type", value: "14", after: 1600 }],
  },
  "tree-view": {
    how: "Folders as deep as you like: arrows open and close, letters jump, and one Tab stop enters the whole tree.",
    steps: [
      { find: "[role=treeitem][aria-expanded=false]", action: "click", after: 900 },
      { find: "[role=treeitem]", action: "key", value: "ArrowDown", after: 900 },
    ],
  },
  "sortable-list": {
    how: "Reorder by dragging, by keyboard (Space to pick up, arrows to move) or with the move buttons, each move announced.",
    steps: [
      { find: "button[aria-label^='Move'][aria-label$='down']", action: "click", after: 1200 },
      { find: "button[aria-label^='Move'][aria-label$='up']", action: "click", after: 1200 },
    ],
  },
  drawer: {
    how: "A panel from the side or bottom on a native dialog: focus stays in, Escape closes, a swipe closes it on touch.",
    steps: open(2000),
  },
  "cookie-consent": {
    how: "Accept and reject side by side, nothing ticked in advance, per-type preferences and a way back to change them.",
    steps: [{ find: "button[aria-haspopup=dialog]", action: "click", after: 2000 }],
  },
  "card-fields": {
    how: "The number groups as you type, the card type is named in words, and a typo fails the card checksum before you pay.",
    steps: [{ find: "input[autocomplete=cc-number]", action: "type", value: "4242424242", after: 1600 }],
  },
  tour: {
    how: "Steps that point at real parts of your page, move focus with them, and can be skipped at any moment.",
    steps: [{ find: "button[aria-haspopup=dialog]", action: "click", after: 2200 }],
  },
  feed: {
    how: "Loads more on a button press or as you scroll, moves focus to the first new item, and says when it has ended.",
    steps: [{ find: "button", action: "click", after: 2000 }],
  },
  lightbox: {
    how: "Thumbnails open a full-screen viewer with arrow keys, swipe and a counter; closing returns you to where you were.",
    steps: [
      { find: "button", action: "click", after: 1000 },
      { find: "button[aria-label='Next picture']", action: "click", after: 1400 },
    ],
  },
  "resizable-panels": {
    how: "Drag the divider, move it with the arrow keys, or press Enter to collapse a panel and bring it back.",
    steps: [
      { find: "[role=separator]", action: "key", value: "ArrowRight", after: 500 },
      { find: "[role=separator]", action: "key", value: "ArrowRight", after: 1400 },
    ],
  },
  "filter-bar": {
    how: "Chips are buttons with aria-pressed; pills remove a filter and hand focus back to its chip, and the status line sums up what is on.",
    steps: [
      { find: "[data-chip]:nth-child(1), button[aria-pressed]:nth-of-type(1)", action: "click", after: 700 },
      { find: "[aria-pressed=false]", action: "click", after: 1500 },
    ],
  },
  "data-grid": {
    how: "Headers sort and report aria-sort; column edges resize by drag or arrow key, and the header stays put while rows scroll.",
    steps: [
      { find: "[data-sort=owner], th:nth-child(2) button", action: "click", after: 900 },
      { find: "[data-handle], [role=separator]", action: "key", value: "ArrowRight", after: 1300 },
    ],
  },
  "kanban": {
    how: "Each card carries buttons that move it a column at a time; focus follows the card and the move is announced with its new position.",
    steps: [
      { find: "[data-card] [data-move='1']:not([hidden]), li button", action: "click", after: 1000 },
      { find: "[data-move='1']:not([hidden])", action: "click", after: 1400 },
    ],
  },
  "confirm-dialog": {
    how: "The confirm button is really disabled until the phrase matches; Escape cancels and focus returns to the trigger.",
    steps: [
      { find: "[data-trigger], button[aria-haspopup=dialog]", action: "click", after: 700 },
      { find: "[data-field], dialog input", action: "type", value: "DELETE", after: 1500 },
    ],
  },
  "session-timeout": {
    how: "After a quiet stretch it warns, counts down, announces 30/20/10/5 seconds and puts focus on Stay signed in.",
    steps: [
      { find: "[data-trigger], button", action: "click", after: 2200 },
    ],
  },
  "unsaved-changes": {
    how: "Typing marks the form unsaved; leaving then opens a dialog where Escape keeps editing rather than discarding.",
    steps: [
      { find: "[data-field], textarea", action: "type", value: "Half a thought", after: 900 },
      { find: "[data-leave], button:nth-of-type(2)", action: "click", after: 1500 },
    ],
  },
  "offline-banner": {
    how: "It follows the browser's online and offline events into a polite status region, and only says \u201cback online\u201d after a drop.",
    steps: [
      { find: "[data-toggle], button", action: "click", after: 1600 },
    ],
  },
  "shortcut-help": {
    how: "? opens the sheet from anywhere but never from inside a field; keys are real kbd elements in a description list.",
    steps: [
      { find: "[data-trigger], button[aria-haspopup=dialog]", action: "click", after: 1600 },
    ],
  },
  "pricing-table": {
    how: "The billing cycle is a real radio group; switching it changes every price and says which prices are showing.",
    steps: [
      { find: "input[value=yearly], .pt-option:nth-child(2) input", action: "click", after: 1500 },
    ],
  },
  "stats-tiles": {
    how: "Each tile is a term and a value in a description list; the change reads \u201c12 more than last week\u201d, and the arrow is decoration.",
  },
  "timeline": {
    how: "The newest few are shown; the reveal button says how many are left and focus lands on the first entry that arrives.",
    steps: [
      { find: "[data-more], button", action: "click", after: 1600 },
    ],
  },
  "comment-thread": {
    how: "Posting adds the comment, keeps focus in the box and says the count out loud, since the new comment lands out of sight.",
    steps: [
      { find: "[data-field], textarea", action: "type", value: "Asked the yard this morning.", after: 800 },
      { find: "[data-post], .ct-post, button[disabled]:not([disabled])", action: "click", after: 1500 },
    ],
  },
  "product-card": {
    how: "Colour and size are fieldsets of radios; out-of-stock options are disabled and say so, and Add waits for both choices.",
    steps: [
      { find: "input[value=Navy]", action: "click", after: 700 },
      { find: "input[value=M]", action: "click", after: 700 },
      { find: "[data-add], .pc-add", action: "click", after: 1400 },
    ],
  },
  "signature-pad": {
    how: "Drawing needs a pointer, so typing the name counts as signing; whether anything is signed is said in words.",
    steps: [
      { find: "[data-typed], input[type=text]", action: "type", value: "Adesh Shukla", after: 900 },
      { find: "[data-confirm], button:nth-of-type(2)", action: "click", after: 1400 },
    ],
  },
  "code-block": {
    how: "Copy writes to the clipboard and says so; if the clipboard is refused it selects the code and says which keys to press.",
    steps: [
      { find: "[data-copy], button:last-of-type", action: "click", after: 1600 },
    ],
  },
  "toolbar": {
    how: "Tab reaches the bar once; the arrow keys move between items, Home and End jump to the ends, and toggles say on or off.",
    steps: [
      { find: "[data-item], [role=toolbar] button", action: "click", after: 800 },
      { find: "[role=toolbar] button[tabindex='0']", action: "key", value: "ArrowRight", after: 700 },
      { find: "[role=toolbar] button[tabindex='0']", action: "key", value: "Enter", after: 1300 },
    ],
  },
  "countdown": {
    how: "The digits are aria-hidden and the status line changes only when the minutes do, so a screen reader is not read to every second.",
  },
};
