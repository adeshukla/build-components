/*
 * The site theme (D87, Adesh chose "Presets first"): one of six finished themes, fine-tuned if wanted,
 * applied to every part on every page. Parts read it through CSS variables with their own look as the
 * fallback (scripts/theme-codemod.py), so `themeCss` is all a page needs: in the builder's preview, the
 * Next.js project's app/bc-theme.css, and the HTML files' <style>.
 *
 * Fonts are system font stacks, so a site still loads nothing from anywhere. Every colour family keeps
 * text and muted text at 4.5:1 or more on its surfaces, in light and in dark (e2e/theme.spec.ts checks).
 */

export const fonts = {
  sans: { label: "System sans", stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  humanist: { label: "Humanist", stack: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif" },
  geometric: { label: "Geometric", stack: "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif" },
  rounded: { label: "Rounded", stack: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', Calibri, source-sans-pro, sans-serif" },
  serif: { label: "Serif", stack: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" },
  oldStyle: { label: "Old style", stack: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, Georgia, serif" },
  mono: { label: "Mono", stack: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace" },
} as const;
export type FontId = keyof typeof fonts;

type Neutrals = { surface: string; sunk: string; text: string; muted: string; line: string };
export const colourFamilies = {
  cool: {
    label: "Cool",
    light: { surface: "#ffffff", sunk: "#f3f4f7", text: "#111827", muted: "#4b5563", line: "#d1d5db" },
    dark: { surface: "#0f1115", sunk: "#1b1e25", text: "#f3f4f6", muted: "#a8adb7", line: "#3a3f4b" },
  },
  warm: {
    label: "Warm",
    light: { surface: "#fffdf9", sunk: "#f5efe6", text: "#231a12", muted: "#5b5045", line: "#ddd2c3" },
    dark: { surface: "#17130f", sunk: "#231d17", text: "#f6efe6", muted: "#bdb1a3", line: "#4a4036" },
  },
  neutral: {
    label: "Grey",
    light: { surface: "#ffffff", sunk: "#f4f4f4", text: "#111111", muted: "#525252", line: "#d4d4d4" },
    dark: { surface: "#0d0d0d", sunk: "#1a1a1a", text: "#f5f5f5", muted: "#a3a3a3", line: "#404040" },
  },
  green: {
    label: "Green",
    light: { surface: "#fbfdfc", sunk: "#edf5f2", text: "#13201d", muted: "#465752", line: "#c8d8d2" },
    dark: { surface: "#0e1513", sunk: "#17221f", text: "#eef5f2", muted: "#a3b5af", line: "#36463f" },
  },
  violet: {
    label: "Violet",
    light: { surface: "#ffffff", sunk: "#f5f3fb", text: "#160f26", muted: "#4f4863", line: "#d6d0e6" },
    dark: { surface: "#110d1c", sunk: "#1c1729", text: "#f5f3fb", muted: "#b2abc6", line: "#3d3552" },
  },
} satisfies Record<string, { label: string; light: Neutrals; dark: Neutrals }>;
export type ColourFamily = keyof typeof colourFamilies;

/** Corner sizes, smallest to largest, for each choice; a part's own corners are the "soft" ones. */
export const cornerScales = {
  square: { label: "Square", sizes: [0, 0, 0, 0, 0, 0] },
  slight: { label: "Slight", sizes: [0.125, 0.25, 0.25, 0.375, 0.5, 0.75] },
  soft: { label: "Soft", sizes: [0.25, 0.375, 0.5, 0.75, 1, 1.5] },
  round: { label: "Round", sizes: [0.375, 0.625, 0.875, 1.25, 1.5, 2] },
} as const;
export type Corners = keyof typeof cornerScales;

export const buttonShapes = { square: { label: "Square", radius: "0" }, rounded: { label: "Rounded", radius: "0.5rem" }, pill: { label: "Pill", radius: "999px" } } as const;
export type ButtonShape = keyof typeof buttonShapes;

export const spacings = { compact: { label: "Compact", scale: 0.75 }, normal: { label: "Normal", scale: 1 }, roomy: { label: "Roomy", scale: 1.35 } } as const;
export type Spacing = keyof typeof spacings;

export type Look = {
  preset: PresetId;
  headingFont: FontId;
  bodyFont: FontId;
  colours: ColourFamily;
  corners: Corners;
  buttons: ButtonShape;
  space: Spacing;
};

export const presets = {
  clean: { label: "Clean", note: "Sans, soft corners", brand: "#2563eb", look: { headingFont: "sans", bodyFont: "sans", colours: "cool", corners: "soft", buttons: "rounded", space: "normal" } },
  editorial: { label: "Editorial", note: "Serif headings, square", brand: "#9a3412", look: { headingFont: "oldStyle", bodyFont: "humanist", colours: "warm", corners: "square", buttons: "square", space: "roomy" } },
  bold: { label: "Bold", note: "Geometric, pills", brand: "#7c3aed", look: { headingFont: "geometric", bodyFont: "sans", colours: "violet", corners: "round", buttons: "pill", space: "normal" } },
  calm: { label: "Calm", note: "Roomy, rounded", brand: "#0f766e", look: { headingFont: "humanist", bodyFont: "humanist", colours: "green", corners: "round", buttons: "rounded", space: "roomy" } },
  mono: { label: "Mono", note: "Black and white", brand: "#111111", look: { headingFont: "mono", bodyFont: "sans", colours: "neutral", corners: "slight", buttons: "square", space: "compact" } },
  warm: { label: "Warm", note: "Friendly serif, pills", brand: "#c2410c", look: { headingFont: "serif", bodyFont: "sans", colours: "warm", corners: "round", buttons: "pill", space: "normal" } },
} as const satisfies Record<string, { label: string; note: string; brand: string; look: Omit<Look, "preset"> }>;
export type PresetId = keyof typeof presets;

export const lookOf = (preset: PresetId): Look => ({ preset, ...presets[preset].look });

/** A look read from a link: anything unknown becomes the preset's own choice. */
export function lookFrom(data: unknown): Look | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = data as Record<string, unknown>;
  const preset = (typeof raw.preset === "string" && raw.preset in presets ? raw.preset : "clean") as PresetId;
  const base = lookOf(preset);
  const pick = <T extends string>(value: unknown, allowed: Record<string, unknown>, fallback: T) =>
    (typeof value === "string" && value in allowed ? value : fallback) as T;
  return {
    preset,
    headingFont: pick(raw.headingFont, fonts, base.headingFont),
    bodyFont: pick(raw.bodyFont, fonts, base.bodyFont),
    colours: pick(raw.colours, colourFamilies, base.colours),
    corners: pick(raw.corners, cornerScales, base.corners),
    buttons: pick(raw.buttons, buttonShapes, base.buttons),
    space: pick(raw.space, spacings, base.space),
  };
}

const sizeNames = ["xs", "sm", "md", "lg", "xl", "2xl"];

/**
 * The theme as CSS: the variables every part reads, the heading font, and the page's own background,
 * which follows the visitor's light/dark choice (<html data-bc-scheme>) and otherwise the system.
 */
export function themeCss(look: Look | undefined) {
  const page = `/* The page itself, light or dark: fixed, or following the system unless the visitor has chosen. */
.bc-page { background: var(--bc-light-surface, #ffffff); color: var(--bc-light-text, #16121f); }
.bc-page--dark { background: var(--bc-dark-surface, #141019); color: var(--bc-dark-text, #f6f5fa); }
@media (prefers-color-scheme: dark) {
  :root:not([data-bc-scheme="light"]) .bc-page--system { background: var(--bc-dark-surface, #141019); color: var(--bc-dark-text, #f6f5fa); }
}
:root[data-bc-scheme="dark"] .bc-page--system { background: var(--bc-dark-surface, #141019); color: var(--bc-dark-text, #f6f5fa); }
`;
  if (!look) return page;
  const family = colourFamilies[look.colours];
  const neutrals = (scheme: "light" | "dark") =>
    Object.entries(family[scheme])
      .map(([key, value]) => `  --bc-${scheme}-${key}: ${value};`)
      .join("\n");
  const corners = cornerScales[look.corners].sizes.map((size, index) => `  --bc-radius-${sizeNames[index]}: ${size}rem;`).join("\n");
  return `/* Theme: ${presets[look.preset].label}${JSON.stringify(lookOf(look.preset)) === JSON.stringify(look) ? "" : ", fine-tuned"} (Build Components). */
:root {
  --bc-font-body: ${fonts[look.bodyFont].stack};
  --bc-font-heading: ${fonts[look.headingFont].stack};
${corners}
  --bc-radius-button: ${buttonShapes[look.buttons].radius};
  --bc-space: ${spacings[look.space].scale};
${neutrals("light")}
${neutrals("dark")}
}
.bc-page { font-family: var(--bc-font-body); }
.bc-page :where(h1, h2, h3, h4, h5, h6) { font-family: var(--bc-font-heading); }
${page}`;
}
