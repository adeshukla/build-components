/*
 * Framework outputs (D92): Vue, Svelte, Angular, Solid and a Web Component, all built from the HTML/CSS/JS
 * output, the one already tested in three browsers. Each is a small file in its framework's own idiom that
 * holds the part's markup (with your options) and, once it is on the page, starts the part's script on it;
 * when the component goes, it stops it again. The script becomes `<slug>.core.js`, a module with `mount()`.
 *
 * Nothing is rewritten per framework, so a framework is only as good as the plain output, and each is
 * tested with every part's own spec (e2e/frameworks.ts). This file is the only place they are built.
 */

export const frameworks = [
  { id: "vue", name: "Vue" },
  { id: "svelte", name: "Svelte" },
  { id: "angular", name: "Angular" },
  { id: "solid", name: "Solid" },
  { id: "web-component", name: "Web Component" },
] as const;
export type FrameworkId = (typeof frameworks)[number]["id"];

export type PartSources = {
  /** The component's name, as the React file exports it: DatePicker. */
  name: string;
  /** The markup for these options (partMarkup in lib/template-output.ts). */
  markup: string;
  css: string;
  /** The plain script with these options applied, or "" for a part with none. */
  js: string;
};

/**
 * The part's script as a module. Its start-up lines (every element marked as one on the page; the header
 * has two, itself and its light and dark switch) become `mount(container)`: the same starts, inside one
 * container, returning what undoes them.
 */
export function coreModule(slug: string, js: string) {
  const lines = js.replace(/\r\n/g, "\n").split("\n");
  const open = lines.indexOf("(function () {");
  let close = lines.length - 1;
  while (close > 0 && lines[close].trim() === "") close--;
  if (open === -1 || lines[close] !== "})();") throw new Error(`${slug}: the script is not one IIFE`);
  const body = lines.slice(open + 1, close);
  const startUpLine = /^ {2}document\.querySelectorAll\((".+?")\)\.forEach\((.+)\);$/;
  const starts = body.map((line) => startUpLine.exec(line)).filter((match) => match !== null);
  if (starts.length === 0) throw new Error(`${slug}: the script never starts itself on the page`);
  return [
    ...lines.slice(0, open),
    ...body.filter((line) => !startUpLine.test(line)).map((line) => line.replace(/^ {2}/, "")),
    "",
    "/**",
    " * Starts the part in `container` and returns what stops it (D92): the listeners, timers and observers",
    " * it set up on the page around it. Its own elements go with the markup.",
    " */",
    "export function mount(container) {",
    "  const undo = [];",
    "  const stopWatching = watch(container, undo);",
    "  try {",
    ...starts.map(([, selector, starter]) => `    container.querySelectorAll(${selector}).forEach(${starter});`),
    "  } finally {",
    "    stopWatching();",
    "  }",
    "  return () => undo.splice(0).forEach((step) => step());",
    "}",
    "",
    "/**",
    " * While the part starts, notes what it attaches outside its own markup, so it can be taken off again.",
    " * ponytail: only what is set up during start-up; what is added later (resize while open) the part",
    " * removes itself, and an interval started later (a carousel's autoplay) outlives an unmount.",
    " */",
    "function watch(container, undo) {",
    "  const proto = EventTarget.prototype;",
    "  const add = proto.addEventListener;",
    "  proto.addEventListener = function (type, listener, options) {",
    "    if (!(this instanceof Node && container.contains(this))) undo.push(() => this.removeEventListener(type, listener, options));",
    "    return add.call(this, type, listener, options);",
    "  };",
    "  const every = window.setInterval;",
    "  window.setInterval = (...args) => {",
    "    const id = every(...args);",
    "    undo.push(() => window.clearInterval(id));",
    "    return id;",
    "  };",
    '  const kinds = ["MutationObserver", "ResizeObserver", "IntersectionObserver"].filter((kind) => kind in window);',
    "  const originals = kinds.map((kind) => window[kind]);",
    "  kinds.forEach((kind, i) => {",
    "    window[kind] = class extends originals[i] {",
    "      constructor(callback) {",
    "        super(callback);",
    "        undo.push(() => this.disconnect());",
    "      }",
    "    };",
    "  });",
    "  return () => {",
    "    proto.addEventListener = add;",
    "    window.setInterval = every;",
    "    kinds.forEach((kind, i) => (window[kind] = originals[i]));",
    "  };",
    "}",
    "",
  ].join("\n");
}

/**
 * A part's markup from its HTML output's page: what is in <body>, without the script tag, the header's
 * stand-in <main> (there so its skip link has somewhere to go) or the demo <main> around a fixed fragment.
 */
export function markupOf(page: string) {
  const inner = page.slice(page.indexOf("<body>") + "<body>".length, page.lastIndexOf("</body>"));
  return inner
    .replace(/\s*<script src="[^"]+"><\/script>/g, "")
    .replace(/\s*<main id="main" class="hd-demo-main"[^>]*>[\s\S]*?<\/main>/, "")
    .trim()
    .replace(/^<main>\s*([\s\S]*?)\s*<\/main>$/, "$1");
}

/** A part with no script still gets a core, so every framework file has the same shape. */
const emptyCore = (stamp: string) =>
  `${stamp}\n\n/** This part has no script: its markup and stylesheet are the whole part. */\nexport function mount() {\n  return () => {};\n}\n`;

const declaration = "/** Starts the part in `container`; call what it returns to stop it. */\nexport function mount(container: HTMLElement): () => void;\n";

/**
 * Text as a JavaScript string that is safe inside a <script> block (a .vue or .svelte file, a page):
 * markup can hold "</script>" (the search part's data does), so "</" is written "<\/" and "<!--" "<\!--".
 */
const asString = (text: string) => JSON.stringify(text).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");

/** The first line of the CSS: which part and version (lib/sources.ts stamps every file). */
const stampOf = (css: string) => css.split("\n")[0].replace(/^\/\* (.*) \*\/$/, "$1");

/** Every file of one framework's output, by file name. */
export function frameworkFiles(framework: FrameworkId, slug: string, part: PartSources): Record<string, string> {
  const stamp = stampOf(part.css);
  const core = part.js ? coreModule(slug, part.js) : emptyCore(`// ${stamp}`);
  const markup = asString(part.markup);
  const tag = `bc-${slug}`;
  const files: Record<string, string> = { [`${slug}.css`]: part.css, [`${slug}.core.js`]: core, [`${slug}.core.d.ts`]: declaration };

  if (framework === "vue") {
    files[`${part.name}.vue`] = `<!-- ${stamp} -->
<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { mount } from "./${slug}.core.js";

// The part's markup, with the options you chose. ${slug}.core.js starts it once it is on the page.
const markup = ${markup};
const root = ref(null);
let stop = () => {};
onMounted(() => (stop = mount(root.value)));
onBeforeUnmount(() => stop());
</script>

<template>
  <div ref="root" style="display: contents" v-html="markup"></div>
</template>

<style src="./${slug}.css"></style>
`;
  }

  if (framework === "svelte") {
    files[`${part.name}.svelte`] = `<!-- ${stamp} -->
<script>
  import { onMount } from "svelte";
  import { mount } from "./${slug}.core.js";
  import "./${slug}.css";

  // The part's markup, with the options you chose. ${slug}.core.js starts it once it is on the page.
  const markup = ${markup};
  let root;
  onMount(() => mount(root));
</script>

<div bind:this={root} style="display: contents">{@html markup}</div>
`;
  }

  if (framework === "angular") {
    files[`${slug}.component.ts`] = `// ${stamp}
import { Component, DestroyRef, ElementRef, ViewEncapsulation, afterNextRender, inject } from "@angular/core";
import { mount } from "./${slug}.core.js";

// The part's markup, with the options you chose. ${slug}.core.js starts it once it is on the page.
const markup = ${markup};

@Component({
  selector: "${tag}",
  template: "",
  styleUrl: "./${slug}.css",
  // The part's stylesheet is written for the page, not for one component's shadow of it.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class ${part.name}Component {
  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    host.innerHTML = markup;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => destroyRef.onDestroy(mount(host)));
  }
}
`;
  }

  if (framework === "solid") {
    files[`${part.name}.tsx`] = `// ${stamp}
import { onCleanup, onMount } from "solid-js";
import { mount } from "./${slug}.core.js";
import "./${slug}.css";

// The part's markup, with the options you chose. ${slug}.core.js starts it once it is on the page.
const markup = ${markup};

export function ${part.name}() {
  let root!: HTMLDivElement;
  onMount(() => onCleanup(mount(root)));
  return <div ref={root} style={{ display: "contents" }} innerHTML={markup} />;
}
`;
  }

  if (framework === "web-component") {
    // One file that works anywhere, with or without a build step: <script src> or import.
    const inlined = core.replace(/^export function mount/m, "function mount");
    return {
      [`${tag}.js`]: `// ${stamp}
// <${tag}></${tag}> anywhere on the page, after this script. Its stylesheet comes with it.
(function () {
${inlined
  .split("\n")
  .filter((line) => line !== `// ${stamp}`)
  .map((line) => (line ? `  ${line}` : line))
  .join("\n")}
  const css = ${asString(part.css)};
  const markup = ${markup};

  class ${part.name}Element extends HTMLElement {
    connectedCallback() {
      if (!document.getElementById("${tag}-css")) {
        const style = document.createElement("style");
        style.id = "${tag}-css";
        style.textContent = css;
        document.head.append(style);
      }
      this.style.display = "contents";
      this.innerHTML = markup;
      this.stop = mount(this);
    }
    disconnectedCallback() {
      this.stop?.();
    }
  }
  if (!customElements.get("${tag}")) customElements.define("${tag}", ${part.name}Element);
})();
`,
    };
  }

  return files;
}

/** The file someone opens first: the component itself. */
export function mainFile(framework: FrameworkId, slug: string, name: string) {
  return { vue: `${name}.vue`, svelte: `${name}.svelte`, angular: `${slug}.component.ts`, solid: `${name}.tsx`, "web-component": `bc-${slug}.js` }[framework];
}
