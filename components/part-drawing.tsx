import type { CSSProperties, ReactNode } from "react";

/*
 * A small drawing of every part, so the catalogue can be scanned by eye before it is read (D71).
 * Drawn from a handful of shapes in a 160×100 box. Hovering or focusing anything marked
 * `drawing-host` plays the drawing: shapes slide (mv), appear (sh), disappear (hd), light up (lt)
 * or draw themselves (dr). The styles are in globals.css under "Part drawings".
 */

type Fx = { mv?: [number, number]; sh?: number; hd?: boolean; lt?: number; dr?: boolean };
/** l line · a accent · f frame · fa accent frame · s surface · k ink · sl stroke · sa accent stroke */
type Kind = "l" | "a" | "f" | "fa" | "s" | "k" | "sl" | "sa";

let keySeed = 0;
function fx(kind: Kind | null, f: Fx = {}) {
  const className = kind ? [`dw-${kind}`] : [];
  const style: Record<string, string> = {};
  if (f.mv) {
    className.push("dw-mv");
    style["--dx"] = `${f.mv[0]}px`;
    style["--dy"] = `${f.mv[1]}px`;
  }
  if (f.sh !== undefined) {
    className.push("dw-sh");
    style["--d"] = `${f.sh}ms`;
  }
  if (f.hd) className.push("dw-hd");
  if (f.lt !== undefined) {
    className.push("dw-lt");
    style["--d"] = `${f.lt}ms`;
  }
  if (f.dr) className.push("dw-dr");
  return { className: className.join(" "), style: style as CSSProperties };
}

const r = (x: number, y: number, w: number, h: number, kind: Kind = "l", f?: Fx, rx = 3) => (
  <rect key={keySeed++} x={x} y={y} width={w} height={h} rx={Math.min(rx, h / 2)} {...fx(kind, f)} />
);
const c = (cx: number, cy: number, radius: number, kind: Kind = "l", f?: Fx) => (
  <circle key={keySeed++} cx={cx} cy={cy} r={radius} {...fx(kind, f)} />
);
const t = (x: number, y: number, text: string, size: number, kind: Kind = "l", f?: Fx) => (
  <text key={keySeed++} x={x} y={y} fontSize={size} textAnchor="middle" fontWeight={700} {...fx(kind, f)}>
    {text}
  </text>
);
const p = (d: string, kind: Kind = "sl", f?: Fx) => <path key={keySeed++} d={d} pathLength={1} {...fx(kind, f)} />;
/** Shapes that move, appear or disappear together. */
const g = (f: Fx, ...children: ReactNode[]) => (
  <g key={keySeed++} {...fx(null, f)}>
    {children}
  </g>
);

/** A few lines of text, the last one shorter. */
const lines = (x: number, y: number, w: number, n: number, gap = 9, kind: Kind = "l") =>
  Array.from({ length: n }, (_, i) => r(x, y + i * gap, i === n - 1 && n > 1 ? w * 0.6 : w, 5, kind));
/** A grid of dots or squares; `on` are accent, `lit` light up on hover one after another. */
const cells = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  step: number,
  size: number,
  { on = [] as number[], lit = [] as number[], round = true } = {},
) =>
  Array.from({ length: cols * rows }, (_, i) => {
    const cx = x + (i % cols) * step;
    const cy = y + Math.floor(i / cols) * step;
    const kind: Kind = on.includes(i) ? "a" : "l";
    const f = lit.includes(i) ? { lt: lit.indexOf(i) * 70 } : undefined;
    return round ? c(cx, cy, size / 2, kind, f) : r(cx - size / 2, cy - size / 2, size, size, kind, f, 2);
  });
const field = (x: number, y: number, w: number, h = 16, kind: Kind = "f") => r(x, y, w, h, kind, undefined, 5);
const button = (x: number, y: number, w: number, kind: Kind = "a", f?: Fx) => r(x, y, w, 12, kind, f, 6);

const drawings: Record<string, ReactNode> = {
  /* ---- Inputs ---- */
  "date-picker": [field(46, 10, 68), r(52, 16, 30, 4), ...cells(52, 38, 7, 4, 9.5, 6, { on: [8], lit: [9, 10, 11, 12] })],
  "searchable-select": [field(38, 14, 84), r(44, 20, 34, 4, "a"), r(38, 36, 84, 46, "s", undefined, 6), r(44, 42, 72, 10, "a", { mv: [0, 12] }, 4), ...lines(48, 44.5, 50, 3, 12)],
  form: [r(40, 12, 30, 4), field(40, 20, 80), r(40, 44, 36, 4), field(40, 52, 80, 16, "fa"), r(40, 73, 54, 4, "a", { sh: 0 })],
  upload: [r(30, 14, 100, 60, "f", undefined, 10), p("M80 56V34M71 42l9-9 9 9", "sa", { mv: [0, -5] }), r(50, 80, 60, 7, "a", { sh: 150 })],
  "multi-select": [field(30, 16, 100, 20), r(35, 21, 24, 10, "a", undefined, 5), r(62, 21, 28, 10, "a", undefined, 5), r(93, 21, 22, 10, "a", { sh: 0 }, 5), r(30, 42, 100, 40, "s", undefined, 6), ...lines(38, 50, 60, 3, 10)],
  password: [field(30, 38, 100, 22), g({ hd: true }, cells(42, 49, 6, 1, 9, 5)), r(40, 46, 50, 6, "l", { sh: 0 }), c(116, 49, 5, "fa")],
  otp: [...Array.from({ length: 6 }, (_, i) => r(28 + i * 18, 36, 14, 22, i < 3 ? "a" : "f", i < 3 ? undefined : { lt: (i - 3) * 90 }, 4))],
  slider: [r(30, 47, 100, 6, "l"), r(30, 47, 40, 6, "a"), r(70, 47, 30, 6, "a", { sh: 0 }), c(70, 50, 8, "s", { mv: [30, 0] }), c(70, 50, 8, "fa", { mv: [30, 0] })],
  "time-picker": [field(44, 10, 72), r(50, 16, 24, 4, "a"), r(44, 32, 72, 56, "s", undefined, 6), r(50, 38, 60, 10, "a", { mv: [0, 12] }, 4), ...lines(56, 40.5, 30, 4, 12)],
  "sortable-list": [0, 1, 2, 3].map((i) =>
    g(i === 1 ? { mv: [0, 18] } : i === 2 ? { mv: [0, -18] } : {}, r(36, 14 + i * 18, 88, 14, i === 1 ? "a" : "s", undefined, 4), r(42, 19 + i * 18, 4, 4), r(52, 19 + i * 18, 40, 4)),
  ),
  "card-fields": [r(35, 14, 90, 56, "s", undefined, 8), r(44, 24, 16, 12, "a", undefined, 3), ...[0, 1, 2].map((i) => r(44 + i * 20, 46, 16, 6, "l")), r(104, 46, 12, 6, "l", { lt: 0 }), r(44, 58, 30, 4)],
  switch: [r(52, 34, 56, 32, "l", { lt: 0 }, 16), c(68, 50, 12, "s", { mv: [24, 0] })],
  rating: [0, 1, 2, 3, 4].map((i) => t(40 + i * 20, 60, "★", 22, i < 2 ? "a" : "l", i < 2 ? undefined : { lt: (i - 2) * 90 })),
  segmented: [r(28, 38, 104, 24, "f", undefined, 12), r(31, 41, 32, 18, "a", { mv: [34, 0] }, 9), ...[0, 1, 2].map((i) => r(38 + i * 34, 47, 18, 6, "l"))],
  "tag-input": [field(26, 36, 108, 26), r(32, 43, 26, 12, "a", undefined, 6), r(62, 43, 30, 12, "a", undefined, 6), r(96, 43, 24, 12, "a", { sh: 0 }, 6)],
  quantity: [r(40, 38, 24, 24, "f", undefined, 6), r(47, 49, 10, 2.5, "k"), r(68, 38, 24, 24, "s", undefined, 6), r(74, 47, 12, 6, "l"), r(96, 38, 24, 24, "fa", { lt: 0 }, 6), p("M108 44v12M102 50h12", "sa")],
  "currency-input": [field(34, 36, 92, 26), t(46, 54, "$", 14, "a"), r(56, 46, 18, 6), c(78, 52, 1.8, "k", { sh: 0 }), r(82, 46, 26, 6)],
  "phone-input": [field(26, 36, 108, 26), r(32, 42, 18, 14, "a", undefined, 3), p("M56 42v14", "sl"), r(62, 46, 22, 6), r(88, 46, 30, 6, "l", { lt: 0 })],
  "inline-edit": [r(34, 44, 74, 8), p("M116 54l10-10 4 4-10 10h-4z", "sa"), r(28, 36, 104, 26, "fa", { sh: 0 }, 6)],
  "color-picker": [...cells(40, 36, 5, 2, 20, 16, { on: [2], round: false }), r(69, 25, 22, 22, "fa", { mv: [20, 20] }, 4)],
  "filter-bar": [r(24, 16, 30, 12, "a", undefined, 6), r(58, 16, 34, 12, "f", { lt: 0 }, 6), r(96, 16, 28, 12, "f", undefined, 6), ...lines(24, 40, 112, 4, 12)],
  "signature-pad": [r(24, 16, 112, 64, "f", undefined, 8), p("M36 58c8-20 14-24 18-8s8 12 14-4 12-14 16 2 8 10 14-2 10-8 16 0", "sa", { dr: true }), r(36, 68, 88, 1.5)],
  "slot-picker": [r(28, 10, 104, 10, "k", undefined, 3), ...cells(46, 36, 3, 3, 34, 12, { on: [4], lit: [7], round: false })],
  "checkbox-group": [0, 1, 2].flatMap((i) => [r(44, 26 + i * 18, 11, 11, i === 0 ? "a" : "f", i === 1 ? { lt: 0 } : undefined, 3), r(62, 29 + i * 18, 54 - i * 8, 5)]),
  "radio-cards": [...[0, 1, 2].map((i) => r(22 + i * 40, 30, 36, 40, "s", undefined, 6)), r(22, 30, 36, 40, "fa", { mv: [40, 0] }, 6), ...[0, 1, 2].map((i) => c(40 + i * 40, 42, 4, "f")), ...[0, 1, 2].map((i) => r(30 + i * 40, 54, 20, 5))],
  "textarea-counter": [r(28, 14, 104, 62, "f", undefined, 6), ...lines(36, 24, 86, 3, 10), r(36, 54, 60, 5, "l", { sh: 0 }), r(106, 82, 26, 5, "a")],
  "select-field": [field(38, 22, 84, 20), r(46, 30, 36, 5), p("M106 29l5 5 5-5", "sa"), r(38, 48, 84, 34, "s", { sh: 0 }, 6)],
  "toggle-group": [r(46, 36, 68, 26, "f", undefined, 6), r(48, 38, 21, 22, "a", undefined, 4), r(69.5, 38, 21, 22, "l", { lt: 0 }, 4), t(58.5, 54, "B", 13, "s"), t(80, 54, "I", 13, "k"), t(101.5, 54, "U", 13, "k")],
  "unit-input": [field(34, 36, 92, 26), r(42, 46, 34, 6), r(96, 38, 28, 22, "l", { lt: 0 }, 4), t(110, 53, "kg", 10, "k")],
  "masked-input": [field(26, 36, 108, 26), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => r(34 + i * 12.5 + (i > 1 ? 4 : 0) + (i > 3 ? 4 : 0), 52, 8, 2.5, i < 3 ? "a" : "l", i < 3 ? undefined : { lt: (i - 3) * 60 }))],
  "date-range": [field(46, 10, 68), ...cells(52, 38, 7, 4, 9.5, 6, { on: [8, 9, 10], lit: [11, 12, 13] })],
  "time-range": [field(22, 38, 48, 22), r(30, 46, 30, 6, "a"), r(76, 48, 8, 2.5), field(90, 38, 48, 22), r(98, 46, 30, 6, "l", { lt: 0 })],
  "dual-slider": [r(26, 47, 108, 6), r(56, 47, 48, 6, "a"), c(56, 50, 8, "s", { mv: [-14, 0] }), c(56, 50, 8, "fa", { mv: [-14, 0] }), c(104, 50, 8, "s", { mv: [14, 0] }), c(104, 50, 8, "fa", { mv: [14, 0] })],
  "pin-pad": [...cells(62, 10, 4, 1, 12, 5, { on: [0, 1], lit: [2] }), ...cells(58, 30, 3, 4, 20, 14, { lit: [4] })],
  "autosave-field": [r(24, 16, 112, 48, "f", undefined, 6), ...lines(32, 26, 90, 3, 10), c(34, 78, 4, "a", { hd: true }), p("M29 78l4 4 7-8", "sa", { sh: 0 }), r(46, 76, 40, 5)],
  "error-summary": [r(28, 14, 104, 70, "s", undefined, 6), r(28, 14, 4, 70, "a", undefined, 2), r(40, 24, 50, 6, "k"), r(40, 40, 70, 5, "a", undefined), r(40, 52, 56, 5, "l", { lt: 0 }), r(40, 64, 62, 5, "l", { lt: 120 })],
  "address-fields": [field(30, 12, 100, 16), field(30, 34, 60, 16), field(96, 34, 34, 16), field(30, 56, 48, 16), field(84, 56, 46, 16, "fa")],
  "help-hint": [r(40, 64, 56, 6), c(106, 67, 7, "fa"), t(106, 71, "?", 10, "a"), g({ mv: [0, -3] }, r(66, 24, 80, 28, "k", undefined, 6), r(72, 32, 56, 4, "s"), r(72, 41, 36, 4, "s"))],

  /* ---- Navigation ---- */
  tabs: [...[0, 1, 2].map((i) => r(30 + i * 36, 18, 26, 5)), r(26, 28, 34, 3, "a", { mv: [36, 0] }), r(22, 32, 116, 50, "f", undefined, 6), ...lines(32, 44, 80, 3, 10)],
  "mega-menu": [r(14, 10, 132, 14, "s", undefined, 4), ...[0, 1, 2, 3].map((i) => r(22 + i * 26, 16, 18, 3, i === 1 ? "a" : "l")), r(20, 30, 120, 58, "s", undefined, 6), ...[0, 1, 2].flatMap((col) => lines(30 + col * 36, 40 + 0, 26, 4, 10, col === 0 ? "a" : "l")), r(26, 36, 32, 46, "fa", { mv: [36, 0] }, 4)],
  menu: [button(42, 12, 44), r(42, 30, 76, 54, "s", undefined, 6), r(46, 34, 68, 11, "a", { mv: [0, 12] }, 4), ...lines(52, 37, 40, 4, 12)],
  pagination: [...[0, 1, 2, 3, 4].map((i) => r(28 + i * 22, 40, 18, 18, "f", undefined, 4)), r(28, 40, 18, 18, "a", { mv: [22, 0] }, 4)],
  breadcrumbs: [r(24, 46, 26, 6), t(58, 53, "/", 12), r(66, 46, 30, 6, "l", { lt: 0 }), t(104, 53, "/", 12), r(112, 46, 24, 6, "a")],
  stepper: [c(36, 48, 7, "a"), r(44, 47, 28, 3, "a"), c(80, 48, 7, "a"), r(88, 47, 28, 3, "l", { lt: 0 }), c(124, 48, 7, "l", { lt: 180 }), ...[36, 80, 124].map((x) => r(x - 12, 62, 24, 4))],
  sidebar: [r(14, 10, 46, 80, "s", undefined, 6), ...[0, 1, 2, 3, 4].map((i) => r(22, 20 + i * 13, 30, 5)), r(18, 16, 38, 12, "fa", { mv: [0, 13] }, 4), ...lines(72, 22, 70, 5, 12)],
  search: [field(30, 12, 100, 20), c(44, 22, 4.5, "sa"), p("M47 25l4 4", "sa"), r(56, 20, 40, 4), r(30, 38, 100, 46, "s", undefined, 6), r(34, 42, 92, 10, "a", { mv: [0, 12] }, 4), ...lines(40, 44.5, 60, 3, 12)],
  "tree-view": [p("M34 18l4 4-4 4", "sa"), r(44, 19, 40, 5, "a"), r(52, 33, 50, 5), r(52, 45, 38, 5), p("M42 58l4 4-4 4", "sl"), r(52, 59, 44, 5), r(60, 72, 46, 5, "l", { sh: 0 }), r(60, 84, 34, 5, "l", { sh: 100 })],
  "back-to-top": [...lines(24, 16, 100, 6, 11), c(122, 76, 11, "a", { mv: [0, -6] }), p("M117 78l5-5 5 5", "s", { mv: [0, -6] })],
  "reading-progress": [r(0, 6, 160, 4), r(0, 6, 64, 4, "a"), r(64, 6, 40, 4, "a", { sh: 0 }), ...lines(32, 24, 96, 6, 11)],
  "language-switcher": [r(50, 10, 60, 22, "f", undefined, 11), c(62, 21, 5, "sa"), t(84, 25, "EN", 10, "k"), r(50, 38, 60, 48, "s", undefined, 6), r(54, 42, 52, 10, "a", { mv: [0, 12] }, 4), ...lines(60, 44.5, 30, 3, 12)],
  toolbar: [r(18, 36, 124, 28, "s", undefined, 6), ...[0, 1, 2, 4, 5, 6].map((i) => r(24 + i * 16.5, 42, 12, 16, i === 0 ? "a" : "l", i === 1 ? { lt: 0 } : undefined, 3)), r(74, 42, 1.5, 16, "l")],
  wizard: [c(48, 16, 6, "a"), r(55, 15, 18, 2.5, "a"), c(80, 16, 6, "l", { lt: 0 }), r(87, 15, 18, 2.5), c(112, 16, 6), field(36, 34, 88), field(36, 56, 88), button(92, 80, 32)],
  "skip-links": [r(14, 14, 132, 16, "s", undefined, 4), ...lines(24, 42, 110, 5, 10), g({ mv: [0, 4] }, r(18, 6, 62, 18, "a", undefined, 9), r(26, 13, 44, 4, "s"))],
  "anchor-nav": [...[0, 1, 2, 3].map((i) => r(22, 20 + i * 14, 34, 5)), r(16, 17, 3, 11, "a", { mv: [0, 14] }, 1.5), ...lines(72, 18, 70, 6, 11)],
  "command-menu": [r(24, 8, 112, 84, "s", undefined, 8), field(32, 16, 96, 16), r(38, 22, 40, 4), t(114, 27, "⌘K", 8, "k"), r(32, 38, 96, 12, "a", { mv: [0, 14] }, 4), ...lines(40, 41.5, 60, 3, 14)],
  "menu-bar": [r(14, 14, 132, 16, "s", undefined, 4), ...[0, 1, 2, 3].map((i) => r(22 + i * 28, 20, 18, 4, i === 1 ? "a" : "l")), r(48, 34, 60, 52, "s", undefined, 6), r(52, 38, 52, 10, "a", { mv: [0, 12] }, 4), ...lines(58, 40.5, 36, 3, 12)],
  "cursor-pagination": [...[0, 1, 2].map((i) => r(30, 10 + i * 16, 100, 12, "s", undefined, 4)), r(30, 58, 100, 12, "s", { sh: 0 }, 4), button(58, 78, 44, "fa")],
  "nav-progress": [r(0, 4, 160, 3), r(0, 4, 70, 3, "a"), r(70, 4, 50, 3, "a", { sh: 0 }), r(14, 18, 132, 12, "s", undefined, 4), ...lines(24, 42, 110, 5, 10)],
  "sticky-header": [r(14, 8, 132, 24, "s", { hd: true }, 5), r(14, 8, 132, 12, "s", { sh: 0 }, 4), r(20, 16, 14, 8, "a", { mv: [0, -4] }, 2), ...lines(24, 42, 110, 5, 10)],

  /* ---- Overlays ---- */
  modal: [r(0, 0, 160, 100, "l", undefined, 0), g({ mv: [0, -3] }, r(38, 20, 84, 60, "s", undefined, 8), lines(48, 32, 60, 2, 10), button(84, 60, 28))],
  tooltip: [button(56, 62, 48, "f", { lt: 0 }), g({ mv: [0, -3] }, r(40, 26, 80, 22, "k", undefined, 5), p("M76 48l4 5 4-5", "k"), r(48, 35, 56, 4, "s"))],
  popover: [button(30, 14, 40, "a"), g({ mv: [0, 3] }, r(30, 32, 90, 52, "s", undefined, 6), r(40, 42, 64, 5, "l", { lt: 0 }), r(40, 53, 64, 5), r(40, 64, 38, 5))],
  toast: [...lines(20, 14, 100, 4, 10), r(58, 52, 90, 16, "s", undefined, 5), r(64, 58, 40, 4), r(58, 72, 90, 16, "s", undefined, 5), r(64, 78, 50, 4, "a"), r(58, 32, 90, 16, "s", { sh: 0, mv: [0, 0] }, 5)],
  drawer: [...lines(14, 16, 80, 6, 11), r(0, 0, 160, 100, "l", { sh: 0 }, 0), g({ mv: [-44, 0] }, r(120, 0, 70, 100, "s", undefined, 0), lines(128, 14, 40, 5, 12))],
  "cookie-consent": [...lines(20, 14, 110, 4, 10), r(10, 66, 140, 30, "s", { mv: [0, -6] }, 6), r(18, 76, 60, 4, "l", { mv: [0, -6] }), button(88, 72, 24, "f", { mv: [0, -6] }), button(116, 72, 26, "a", { mv: [0, -6] })],
  tour: [...[0, 1, 2].map((i) => r(20 + i * 42, 16, 36, 22, "s", undefined, 4)), r(17, 13, 42, 28, "fa", { mv: [42, 0] }, 6), r(26, 48, 80, 36, "k", { mv: [42, 0] }, 6), ...[0, 1, 2].map((i) => c(40 + i * 8, 76, 2, i === 0 ? "a" : "s", { mv: [42, 0] }))],
  "confirm-dialog": [r(34, 20, 92, 60, "s", undefined, 8), r(44, 30, 50, 6, "k"), r(44, 42, 70, 4), r(64, 60, 24, 12, "f", undefined, 6), button(92, 60, 26, "a", { lt: 0 })],
  "session-timeout": [r(34, 16, 92, 68, "s", undefined, 8), c(80, 40, 12, "f"), p("M80 28a12 12 0 1 1-12 12", "sa", { dr: true }), r(58, 60, 44, 4), button(62, 68, 36)],
  "shortcut-help": [r(26, 10, 108, 80, "s", undefined, 8), ...[0, 1, 2, 3].flatMap((i) => [r(36, 22 + i * 16, 16, 11, i === 1 ? "a" : "f", undefined, 3), r(58, 25 + i * 16, 50 - i * 6, 5)])],
  "hover-card": [r(30, 80, 40, 5, "a"), r(30, 88, 40, 1.5, "a"), g({ mv: [0, -3] }, r(26, 12, 100, 58, "s", undefined, 8), c(44, 30, 9, "a"), r(58, 26, 50, 5, "k"), r(58, 36, 36, 4), r(36, 48, 80, 4), r(36, 57, 60, 4))],
  "bottom-sheet": [r(50, 4, 60, 92, "f", undefined, 10), ...lines(58, 14, 44, 4, 9), r(52, 60, 56, 34, "s", { mv: [0, -14] }, 8), r(72, 64, 16, 3, "l", { mv: [0, -14] }), button(60, 76, 40, "a", { mv: [0, -14] })],

  /* ---- Page sections ---- */
  header: [r(10, 30, 140, 30, "s", undefined, 6), r(18, 39, 12, 12, "a", undefined, 3), ...[0, 1, 2].map((i) => r(46 + i * 20, 43, 14, 4)), button(112, 39, 30, "k", { lt: 0 })],
  footer: [...lines(20, 12, 100, 3, 10), r(10, 48, 140, 46, "s", undefined, 6), ...[0, 1, 2].flatMap((col) => lines(20 + col * 42, 58, 30, 3, 10, col === 0 ? "a" : "l"))],
  cta: [r(14, 22, 132, 56, "a", undefined, 10), r(26, 36, 70, 7, "s"), r(26, 50, 50, 4, "s"), button(26, 60, 34, "s", { mv: [0, -2] })],
  "pricing-table": [r(26, 30, 34, 56, "s", undefined, 5), r(64, 18, 34, 68, "fa", { mv: [0, -4] }, 5), r(102, 30, 34, 56, "s", undefined, 5), ...[31, 69, 107].map((x) => r(x, 40 + (x === 69 ? -10 : 0), 22, 6, x === 69 ? "a" : "k"))],
  hero: [r(20, 20, 70, 9, "k"), r(20, 33, 54, 9, "k"), ...lines(20, 50, 64, 2, 8), button(20, 70, 30, "a", { mv: [0, -2] }), button(54, 70, 28, "f"), r(98, 18, 46, 64, "a", undefined, 8)],
  "feature-grid": [...cells(36, 32, 3, 2, 44, 36, { round: false }), ...[0, 1, 2, 3, 4, 5].map((i) => c(26 + (i % 3) * 44, 24 + Math.floor(i / 3) * 44, 4, i === 0 ? "a" : "s", i === 1 ? { lt: 0 } : undefined))],
  "how-it-works": [...[0, 1, 2].map((i) => c(36 + i * 44, 36, 11, i === 0 ? "a" : "f", i === 1 ? { lt: 0 } : i === 2 ? { lt: 150 } : undefined)), r(48, 35, 20, 2), r(92, 35, 20, 2), ...[0, 1, 2].flatMap((i) => lines(22 + i * 44, 56, 28, 2, 9))],
  newsletter: [r(30, 24, 100, 8, "k"), r(40, 38, 80, 4), field(26, 52, 76, 20), r(106, 52, 30, 20, "a", { lt: 0 }, 5)],
  "team-grid": [0, 1, 2, 3].flatMap((i) => [c(34 + i * 31, 40, 11, i === 0 ? "a" : "l", i === 1 ? { lt: 0 } : undefined), r(24 + i * 31, 58, 20, 4, "k"), r(26 + i * 31, 66, 16, 3)]),
  "logo-wall": cells(34, 36, 4, 2, 31, 22, { lit: [1, 6], round: false }),
  "page-header": [r(24, 20, 50, 4), r(24, 32, 96, 12, "k"), r(24, 52, 110, 5), r(24, 62, 80, 5), r(24, 76, 112, 1.5, "a")],
  "split-feature": [r(18, 18, 60, 64, "a", undefined, 8), r(88, 26, 54, 8, "k"), ...lines(88, 42, 54, 3, 9), button(88, 70, 30, "f", { lt: 0 })],
  "stat-comparison": [r(34, 50, 36, 34, "l", undefined, 4), r(90, 20, 36, 64, "a", { mv: [0, -4] }, 4), r(38, 40, 28, 5, "k"), r(94, 10, 28, 5, "k", { mv: [0, -4] })],

  /* ---- Content ---- */
  cart: [r(38, 6, 84, 88, "s", undefined, 8), ...[0, 1, 2].flatMap((i) => [r(46, 16 + i * 18, 14, 14, "l", undefined, 3), r(66, 19 + i * 18, 40, 4, "k"), r(66, 26 + i * 18, 24, 3)]), r(46, 72, 68, 1.5), button(46, 78, 68, "a", { lt: 0 })],
  carousel: [...[0, 1, 2, 3].map((i) => r(8 + i * 52, 22, 46, 48, i === 1 ? "a" : "l", { mv: [-52, 0] }, 6)), ...[0, 1, 2].map((i) => c(70 + i * 10, 84, 2.5, i === 0 ? "a" : "l"))],
  accordion: [r(30, 12, 100, 14, "a", undefined, 4), ...lines(38, 32, 70, 2, 9), r(30, 54, 100, 14, "s", { mv: [0, 6] }, 4), r(30, 72, 100, 14, "s", { mv: [0, 6] }, 4)],
  table: [r(20, 16, 120, 12, "a", undefined, 3), ...[0, 1, 2, 3].map((i) => r(20, 32 + i * 14, 120, 10, i === 1 ? "l" : "s", i === 2 ? { lt: 0 } : undefined, 3)), r(20, 31, 120, 1)],
  feed: [...[0, 1].flatMap((i) => [r(34, 8 + i * 30, 92, 26, "s", undefined, 5), c(44, 18 + i * 30, 5, i === 0 ? "a" : "l"), r(54, 15 + i * 30, 50, 4, "k"), r(54, 23 + i * 30, 62, 3)]), r(34, 68, 92, 26, "s", { sh: 0 }, 5), c(44, 78, 5, "l", { sh: 0 }), r(54, 75, 44, 4, "k", { sh: 0 })],
  lightbox: [r(0, 0, 160, 100, "k", undefined, 0), r(34, 14, 92, 64, "a", { mv: [0, -2] }, 4), c(18, 46, 7, "s"), c(142, 46, 7, "s"), ...[0, 1, 2].map((i) => c(70 + i * 10, 88, 2.5, i === 0 ? "s" : "l"))],
  "resizable-panels": [r(14, 14, 132, 72, "f", undefined, 6), ...lines(22, 24, 44, 5, 11), r(76, 14, 2, 72, "a", { mv: [14, 0] }), r(73, 42, 8, 16, "a", { mv: [14, 0] }, 4), ...lines(90, 24, 46, 5, 11)],
  "avatar-group": [...[0, 1, 2].flatMap((i) => [c(50 + i * 18, 50, 13, i === 0 ? "a" : "s", i === 2 ? { mv: [-3, 0] } : undefined), c(50 + i * 18, 46, 4.5, i === 0 ? "s" : "l", i === 2 ? { mv: [-3, 0] } : undefined), r(43 + i * 18, 53, 14, 6, i === 0 ? "s" : "l", i === 2 ? { mv: [-3, 0] } : undefined)]), c(104, 50, 13, "k", { mv: [-6, 0] }), t(104, 54, "+3", 10, "s", { mv: [-6, 0] })],
  badge: [r(24, 42, 34, 16, "a", undefined, 8), r(64, 42, 40, 16, "f", { lt: 0 }, 8), r(110, 42, 28, 16, "k", undefined, 8), c(32, 50, 2.5, "s")],
  "data-grid": [...cells(38, 32, 4, 3, 28, 20, { round: false }), r(24, 12, 112, 6, "a"), r(52, 40, 26, 18, "fa", { mv: [28, 14] }, 3)],
  kanban: [...[0, 1, 2].map((i) => r(14 + i * 46, 10, 40, 80, "l", undefined, 6)), r(18, 22, 32, 18, "s", undefined, 4), r(18, 44, 32, 18, "a", { mv: [46, 0] }, 4), r(64, 22, 32, 18, "s", undefined, 4), r(110, 22, 32, 18, "s", undefined, 4), ...[0, 1, 2].map((i) => r(20 + i * 46, 14, 20, 3, "k"))],
  "stats-tiles": [0, 1, 2].flatMap((i) => [r(14 + i * 46, 26, 40, 48, "s", undefined, 6), r(20 + i * 46, 34, 20, 8, "k"), r(20 + i * 46, 46, 26, 3), p(`M${20 + i * 46} 66l6-4 6 3 6-7 8-2`, "sa", i === 1 ? { dr: true } : undefined)]),
  timeline: [r(42, 10, 2, 80, "l"), ...[0, 1, 2].flatMap((i) => [c(43, 20 + i * 28, 5, i === 0 ? "a" : "s", i === 1 ? { lt: 0 } : undefined), c(43, 20 + i * 28, 5, "f"), r(56, 16 + i * 28, 60, 4, "k"), r(56, 24 + i * 28, 44, 3)])],
  "comment-thread": [c(34, 22, 8, "a"), r(48, 14, 88, 22, "s", undefined, 6), r(54, 20, 50, 4), r(54, 28, 70, 3), c(52, 54, 7, "l"), r(64, 46, 72, 20, "s", undefined, 6), r(70, 53, 44, 4), r(64, 72, 72, 20, "s", { sh: 0 }, 6), r(70, 79, 40, 4, "a", { sh: 0 })],
  "product-card": [r(46, 6, 68, 88, "s", undefined, 8), r(52, 12, 56, 40, "a", undefined, 5), r(52, 58, 40, 5, "k"), r(52, 67, 22, 5, "a"), button(52, 76, 56, "k", { lt: 0 })],
  "code-block": [r(18, 16, 124, 68, "k", undefined, 8), r(28, 28, 40, 4, "a"), r(72, 28, 30, 4, "s"), r(36, 40, 56, 4, "s"), r(36, 52, 44, 4, "a"), r(28, 64, 24, 4, "s"), r(112, 22, 24, 12, "s", { hd: true }, 6), p("M118 28l4 4 8-8", "sa", { sh: 0 })],
  faq: [...[0, 1, 2].flatMap((i) => [r(24, 14 + i * 20 + (i > 0 ? 18 : 0), 112, 1.5), r(24, 20 + i * 20 + (i > 0 ? 18 : 0), 70, 5, i === 0 ? "k" : "l"), t(132, 26 + i * 20 + (i > 0 ? 18 : 0), i === 0 ? "−" : "+", 12, "a")]), ...lines(24, 30, 90, 2, 8)],
  "details-list": [0, 1, 2, 3].flatMap((i) => [r(28, 22 + i * 15, 30, 5, "l"), r(72, 22 + i * 15, 60 - i * 8, 5, i === 0 ? "k" : "l", i === 2 ? { lt: 0 } : undefined)]),
  "comparison-table": [r(20, 14, 120, 12, "l", undefined, 3), ...[0, 1, 2, 3].flatMap((i) => [r(24, 34 + i * 14, 40, 4), t(88, 40 + i * 14, "✓", 10, "a"), t(118, 40 + i * 14, i < 2 ? "✓" : "–", 10, i < 2 ? "a" : "l", i === 2 ? { lt: 0 } : undefined)])],
  changelog: [0, 1, 2].flatMap((i) => [r(20, 12 + i * 28, 26, 11, i === 0 ? "a" : "f", undefined, 5.5), r(54, 14 + i * 28, 80 - i * 12, 5, "k"), r(54, 23 + i * 28, 60, 3, "l", i === 1 ? { lt: 0 } : undefined)]),
  "row-actions": [...[0, 1, 2, 3].flatMap((i) => [r(20, 12 + i * 20, 120, 16, "s", undefined, 4), r(28, 18 + i * 20, 60 - i * 6, 4), t(130, 23 + i * 20, "⋯", 12, i === 1 ? "a" : "k")]), r(94, 40, 44, 34, "s", { sh: 0 }, 5), r(100, 46, 30, 4, "a", { sh: 0 }), r(100, 56, 26, 4, "l", { sh: 0 })],
  "order-tracker": [r(26, 47, 108, 3), r(26, 47, 54, 3, "a"), r(80, 47, 27, 3, "a", { sh: 0 }), ...[0, 1, 2, 3, 4].map((i) => c(26 + i * 27, 48.5, 6, i < 3 ? "a" : "s", i === 3 ? { lt: 0 } : undefined)), ...[0, 2, 4].map((i) => r(16 + i * 27, 62, 20, 4))],
  "invoice-summary": [r(36, 8, 88, 84, "s", undefined, 6), ...[0, 1, 2].flatMap((i) => [r(44, 18 + i * 12, 40, 4), r(98, 18 + i * 12, 18, 4)]), r(44, 56, 72, 1.5, "k"), r(44, 64, 30, 6, "k"), r(90, 64, 26, 6, "a", { lt: 0 })],
  "article-card": [r(40, 6, 80, 88, "s", undefined, 8), r(46, 12, 68, 38, "a", undefined, 5), r(46, 56, 24, 8, "f", undefined, 4), r(46, 70, 60, 5, "k"), r(46, 79, 44, 5, "k", { lt: 0 })],
  "author-byline": [c(46, 50, 14, "a"), r(68, 40, 56, 7, "k"), r(68, 53, 40, 4, "l", { lt: 0 }), r(112, 53, 14, 4)],
  "image-gallery": [r(20, 14, 58, 42, "a", undefined, 5), r(82, 14, 58, 20, "l", { lt: 0 }, 5), r(82, 38, 58, 18, "l", undefined, 5), r(20, 60, 36, 28, "l", undefined, 5), r(60, 60, 80, 28, "l", { lt: 120 }, 5)],
  "video-embed": [r(20, 16, 120, 68, "k", undefined, 8), c(80, 50, 14, "a", { mv: [0, 0] }), p("M76 43l10 7-10 7z", "s")],
  "pull-quote": [r(24, 20, 4, 60, "a", undefined, 2), t(46, 44, "“", 34, "a"), r(58, 28, 76, 7, "k"), r(58, 40, 70, 7, "k"), r(58, 52, 50, 7, "k", { lt: 0 }), r(58, 68, 36, 4)],

  /* ---- Feedback ---- */
  "alert-banner": [r(12, 32, 136, 36, "s", undefined, 6), r(12, 32, 4, 36, "a", undefined, 2), c(30, 50, 7, "a"), r(44, 42, 70, 5, "k"), r(44, 52, 50, 4), p("M128 44l8 8M136 44l-8 8", "sl", { lt: 0 })],
  skeleton: (
    <g className="dw-pulse">
      {c(44, 50, 14)}
      {r(66, 38, 60, 7)}
      {r(66, 50, 50, 6)}
      {r(66, 61, 36, 6)}
    </g>
  ),
  "empty-state": [r(26, 10, 108, 80, "f", undefined, 10), c(80, 34, 11, "l"), r(56, 52, 48, 6, "k"), r(62, 62, 36, 4), button(64, 72, 32, "a", { mv: [0, -2] })],
  "unsaved-changes": [...lines(18, 14, 110, 5, 10), r(0, 0, 160, 100, "l", undefined, 0), r(40, 26, 80, 48, "s", undefined, 8), r(50, 36, 50, 6, "k"), r(62, 56, 24, 11, "f", undefined, 5.5), r(90, 56, 22, 11, "a", { lt: 0 }, 5.5)],
  "offline-banner": [r(0, 12, 160, 22, "k", { mv: [0, -2] }, 0), p("M22 25a10 10 0 0 1 14 0M25 28a5 5 0 0 1 8 0", "sa", { mv: [0, -2] }), r(44, 21, 60, 5, "s", { mv: [0, -2] }), ...lines(24, 48, 110, 4, 10)],
  countdown: [0, 1, 2, 3].flatMap((i) => [r(20 + i * 32, 32, 26, 34, i === 3 ? "a" : "s", i === 3 ? { lt: 0 } : undefined, 5), r(26 + i * 32, 44, 14, 8, i === 3 ? "s" : "k"), r(24 + i * 32, 72, 18, 3)]),
  "loading-button": [r(40, 36, 80, 28, "a", undefined, 14), <g key={keySeed++} className="dw-spin">{p("M62 43a7 7 0 1 1-7 7", "s")}</g>, r(74, 47, 32, 6, "s")],
  "undo-snackbar": [...lines(20, 14, 110, 4, 10), r(20, 62, 120, 24, "k", { mv: [0, -4] }, 6), r(30, 71, 56, 5, "s", { mv: [0, -4] }), r(108, 70, 24, 7, "a", { mv: [0, -4] }, 3)],
  "inline-confirm": [r(16, 36, 128, 28, "s", undefined, 6), r(26, 47, 50, 6, "k"), r(90, 43, 22, 14, "f", { hd: true }, 7), r(88, 43, 24, 14, "f", { sh: 0 }, 7), r(116, 43, 22, 14, "a", { sh: 0 }, 7)],
  "circular-progress": [c(80, 50, 26, "f"), p("M80 24a26 26 0 1 1-26 26", "sa", { dr: true }), r(68, 46, 24, 8, "k")],
  "error-state": [c(80, 30, 13, "a"), r(78.5, 22, 3, 10, "s"), c(80, 36, 1.8, "s"), r(52, 52, 56, 6, "k"), r(60, 63, 40, 4), button(62, 74, 36, "f", { lt: 0 })],
  "maintenance-notice": [r(26, 14, 108, 72, "s", undefined, 8), c(50, 40, 12, "a"), p("M50 33v7l5 4", "s"), r(70, 32, 52, 6, "k"), r(70, 44, 44, 4), r(36, 62, 88, 4), r(36, 70, 60, 4, "l", { lt: 0 })],
  "notification-list": [p("M34 30a8 8 0 0 1 16 0v8l3 4H31l3-4z", "sa"), c(50, 24, 3.5, "a", { sh: 0 }), ...[0, 1, 2].flatMap((i) => [r(62, 16 + i * 24, 76, 20, "s", undefined, 5), c(70, 26 + i * 24, 3, i < 2 ? "a" : "l", i === 1 ? { hd: true } : undefined), r(78, 21 + i * 24, 44, 4, "k"), r(78, 28 + i * 24, 34, 3)])],
};

/** The drawing for one part, tinted with its accent. Decorative: the card's text says what it is. */
export function PartDrawing({ slug, accent, className = "" }: { slug: string; accent: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 100"
      className={`part-drawing ${className}`}
      style={{ ["--part-accent" as string]: accent }}
    >
      {drawings[slug] ?? lines(40, 40, 80, 3, 10)}
    </svg>
  );
}

export const drawnSlugs = Object.keys(drawings);
