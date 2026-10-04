import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { transformSync as babel } from "@babel/core";
import { build, transformSync, type Plugin } from "esbuild";
import { compile as compileSvelte } from "svelte/compiler";
import { compileScript, parse as parseVue } from "vue/compiler-sfc";
import { frameworkFiles, frameworks, type FrameworkId } from "../lib/framework-output";
import { applyConfig } from "../lib/export";
import { parseConfig } from "../lib/schema";
import { readComponentSources, readTemplateSources } from "../lib/sources";
import { partMarkup } from "../lib/template-output";
import { components } from "./generate";

/*
 * Framework outputs under test (D92). For every part and variant, each framework's files are written out,
 * compiled with that framework's own compiler, bundled into one classic script and put on a page that is
 * the HTML/CSS/JS output's page with the markup swapped for the component. Every part's spec then runs on
 * it as one more output (`targets` in e2e/helpers.ts).
 *
 * The frameworks themselves are bundled once, into _runtime/<framework>.js, and shared by every page.
 * A page is rebuilt only when what it is built from changes.
 */

const root = path.join(__dirname, ".generated");
const runtimeDir = path.join(root, "_runtime");
const specifier = /^(vue|svelte|solid-js|@angular\/[a-z-]+)(\/.*)?$/;

/** Imports of a framework read the shared runtime instead, and are noted so the runtime holds them. */
function shared(seen: Set<string>): Plugin {
  return {
    name: "shared-runtime",
    setup(build) {
      build.onResolve({ filter: specifier }, (args) => {
        seen.add(args.path);
        return { path: args.path, namespace: "bc-runtime" };
      });
      build.onLoad({ filter: /.*/, namespace: "bc-runtime" }, (args) => ({
        contents: `module.exports = window.__bcRuntime[${JSON.stringify(args.path)}];`,
        loader: "js",
      }));
    },
  };
}

/** Each framework's own compiler, as its build tool would run it. */
const compilers: Plugin = {
  name: "framework-compilers",
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, (args) => {
      const { descriptor } = parseVue(fs.readFileSync(args.path, "utf8"), { filename: args.path });
      return { contents: compileScript(descriptor, { id: path.basename(args.path), inlineTemplate: true, isProd: true }).content, loader: "js" };
    });
    build.onLoad({ filter: /\.svelte$/ }, (args) => ({
      contents: compileSvelte(fs.readFileSync(args.path, "utf8"), { filename: args.path, css: "external" }).js.code,
      loader: "js",
    }));
    build.onLoad({ filter: /\.tsx$/ }, (args) => {
      // Types off with esbuild, then Solid's JSX with Solid's own Babel preset.
      const plain = transformSync(fs.readFileSync(args.path, "utf8"), { loader: "tsx", jsx: "preserve" }).code;
      const solid = babel(plain, { filename: args.path.replace(/\.tsx$/, ".jsx"), presets: [["babel-preset-solid", { generate: "dom" }]], babelrc: false, configFile: false });
      return { contents: solid!.code!, loader: "js" };
    });
    build.onLoad({ filter: /\.component\.ts$/ }, (args) => ({
      // The page links the stylesheet; in JIT, Angular would otherwise fetch styleUrl itself.
      contents: fs.readFileSync(args.path, "utf8").replace(/^\s*styleUrl: .*\n/m, ""),
      loader: "ts",
    }));
  },
};

/** What starts the component on the page and marks the page, plus `__bcUnmount` for the clean-up test. */
function entry(framework: FrameworkId, slug: string, name: string) {
  const done = 'document.documentElement.dataset.mounted = "true";';
  return {
    vue: [`entry.js`, `import { createApp } from "vue";
import Part from "./${name}.vue";
const app = createApp(Part);
app.mount("#app");
window.__bcUnmount = () => app.unmount();
${done}
`],
    svelte: [`entry.js`, `import { mount, unmount } from "svelte";
import Part from "./${name}.svelte";
const part = mount(Part, { target: document.getElementById("app") });
window.__bcUnmount = () => unmount(part);
${done}
`],
    solid: [`entry.tsx`, `import { render } from "solid-js/web";
import { ${name} } from "./${name}";
const dispose = render(() => <${name} />, document.getElementById("app")!);
(window as any).__bcUnmount = dispose;
${done}
`],
    angular: [
      `entry.ts`,
      `import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { ${name}Component } from "./${slug}.component";
bootstrapApplication(${name}Component, { providers: [provideZonelessChangeDetection()] })
  .then(async (app) => {
    await app.injector.get(ApplicationRef).whenStable();
    (window as any).__bcUnmount = () => app.destroy();
    ${done}
  });
`,
    ],
  }[framework as Exclude<FrameworkId, "web-component">];
}

const write = (file: string, content: string) => {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

/** Builds every framework page that is out of date, then the shared runtimes. */
export async function generateFrameworkOutputs(only?: string[]) {
  const jobs: (() => Promise<void>)[] = [];
  const seen: Record<string, Set<string>> = Object.fromEntries(frameworks.map((framework) => [framework.id, new Set<string>()]));
  for (const [slug, component] of Object.entries(components)) {
    if (only && !only.includes(slug)) continue;
    const sources = readComponentSources(slug);
    const { exportNames } = readTemplateSources([slug]);
    for (const [variant, query] of Object.entries(component.variants)) {
      const config = parseConfig(component.schema, new URLSearchParams(query));
      const plainPage = fs.readFileSync(path.join(root, slug, variant, "index.html"), "utf8");
      const markup = partMarkup(slug, config, sources.html);
      if (!plainPage.includes(markup)) throw new Error(`${slug}/${variant}: the plain page does not hold the part's markup`);
      const part = { name: exportNames[slug], markup, css: sources.css, js: sources.js && applyConfig(sources.js, config) };

      for (const { id: framework } of frameworks) {
        const dir = path.join(root, slug, variant, `fw-${framework}`);
        const files = frameworkFiles(framework, slug, part);
        const tag = `bc-${slug}`;
        const mountPoint = framework === "angular" || framework === "web-component" ? `<${tag}></${tag}>` : `<div id="app" style="display: contents"></div>`;
        const scripts =
          framework === "web-component"
            ? `<script src="${tag}.js"></script>\n    <script>window.__bcUnmount = () => document.querySelector("${tag}").remove(); document.documentElement.dataset.mounted = "true";</script>`
            : `<script src="../../../_runtime/${framework}.js"></script>\n    <script src="app.js"></script>`;
        const page = plainPage
          .replace(markup, mountPoint)
          .replace(/<script src="[^"]+\.js"><\/script>/, "")
          .replace(`href="${slug}.css"`, `href="../${slug}.css"`)
          .replace("</body>", `    ${scripts}\n  </body>`);

        for (const [file, content] of Object.entries(files)) write(path.join(dir, file), content);
        write(path.join(dir, "index.html"), page);
        if (framework === "web-component") continue;

        const [entryFile, entryCode] = entry(framework, slug, part.name);
        write(path.join(dir, entryFile), entryCode);
        const key = crypto.createHash("sha1").update(JSON.stringify([files, entryCode, fs.readFileSync(__filename, "utf8")])).digest("hex");
        const keyFile = path.join(dir, ".built");
        const imports = path.join(dir, ".imports");
        if (fs.existsSync(keyFile) && fs.readFileSync(keyFile, "utf8") === key && fs.existsSync(imports)) {
          for (const spec of fs.readFileSync(imports, "utf8").split("\n").filter(Boolean)) seen[framework].add(spec);
          continue;
        }
        jobs.push(async () => {
          const used = new Set<string>();
          await build({
            entryPoints: [path.join(dir, entryFile)],
            outfile: path.join(dir, "app.js"),
            bundle: true,
            format: "iife",
            loader: { ".css": "empty" },
            plugins: [shared(used), compilers],
            tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
            logLevel: "error",
          });
          used.forEach((spec) => seen[framework].add(spec));
          fs.writeFileSync(imports, [...used].join("\n"));
          fs.writeFileSync(keyFile, key);
        });
      }
    }
  }
  // Eight at a time: esbuild is quick, the compilers are not.
  for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map((job) => job()));

  // One runtime per framework, holding every import the pages make. Angular's compiler goes first: JIT.
  for (const [framework, specs] of Object.entries(seen)) {
    if (specs.size === 0) continue;
    const list = [...specs].sort((a, b) => (a === "@angular/compiler" ? -1 : b === "@angular/compiler" ? 1 : a.localeCompare(b)));
    if (framework === "angular" && !list.includes("@angular/compiler")) list.unshift("@angular/compiler");
    const code = `window.__bcRuntime = window.__bcRuntime || {};\n${list.map((spec, i) => `import * as m${i} from ${JSON.stringify(spec)};\nwindow.__bcRuntime[${JSON.stringify(spec)}] = m${i};`).join("\n")}\n`;
    const file = path.join(runtimeDir, `${framework}.entry.js`);
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === code && fs.existsSync(path.join(runtimeDir, `${framework}.js`))) continue;
    write(file, code);
    await build({ entryPoints: [file], outfile: path.join(runtimeDir, `${framework}.js`), bundle: true, format: "iife", minify: true, logLevel: "error", define: { "process.env.NODE_ENV": '"production"' } });
  }
}
