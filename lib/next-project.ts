import { applyConfig } from "@/lib/export";
import { regionOf } from "@/lib/page-builder";
import { siteTemplates, type BuiltSite } from "@/lib/site-builder";
import { readComponentSources, readTemplateSources } from "@/lib/sources";
import { templateHtml, templateReactSource } from "@/lib/template-output";
import { resolve } from "@/lib/templates";

/*
 * What a website from the builder goes out as (D80, D86). Server only: it reads the parts from /registry.
 *
 * Every page is the page.tsx the other outputs give. The shared header and footer are one file each in
 * components/; a page's own parts are in components/<page>/, written with that page's options, so two
 * pages can each have, say, a page header of their own.
 */

const pageFile = (path: string) => (path === "/" ? "app/page.tsx" : `app${path}/page.tsx`);
const htmlFile = (path: string) => (path === "/" ? "index.html" : `${path.slice(1)}.html`);
const partFile = (pageId: string, slug: string) => (regionOf(slug) === "main" ? `components/${pageId}/${slug}.tsx` : `components/${slug}.tsx`);

/** Each page's file, and each part's file with its options in place. */
function siteSources(site: BuiltSite) {
  const pages = siteTemplates(site);
  const { exportNames } = readTemplateSources(pages.flatMap(({ template }) => template.sections.map((section) => section.slug)));
  const pageFiles: Record<string, string> = {};
  const partFiles: Record<string, string> = {};
  for (const { page, template, options } of pages) {
    pageFiles[pageFile(page.path)] = templateReactSource(template, options, exportNames, (slug) => `@/${partFile(page.id, slug).replace(/\.tsx$/, "")}`);
    for (const section of resolve(template, options)) {
      partFiles[partFile(page.id, section.slug)] = applyConfig(readComponentSources(section.slug).react, section.config);
    }
  }
  return { pageFiles, partFiles };
}

/** The site's pages as HTML files, each needing nothing else, linked to one another. */
export function siteHtml(site: BuiltSite) {
  const pages = siteTemplates(site);
  const { sources } = readTemplateSources(pages.flatMap(({ template }) => template.sections.map((section) => section.slug)));
  // A link to one of the site's pages goes to that page's file, so the files work opened from a folder.
  const local = (html: string) =>
    html.replace(/href="(\/[a-z0-9-]*)"/g, (link, path: string) => (site.pages.some((page) => page.path === path) ? `href="${htmlFile(path)}"` : link));
  return Object.fromEntries(pages.map(({ page, template, options }) => [htmlFile(page.path), local(templateHtml(template, options, sources))]));
}

/** The site as one shadcn registry item: every page at its route, every part at its file. */
export function siteRegistryItem(site: BuiltSite) {
  const { pageFiles, partFiles } = siteSources(site);
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site",
    type: "registry:block",
    title: `${site.name} website`,
    description: `${site.pages.length} ${site.pages.length === 1 ? "page" : "pages"} for ${site.name}, put together from parts.`,
    files: [
      ...Object.entries(pageFiles).map(([path, content]) => ({ path, type: "registry:page", target: path, content })),
      ...Object.entries(partFiles).map(([path, content]) => ({ path, type: "registry:component", target: path, content })),
    ],
  };
}

/**
 * The site as a Next.js project that runs as it is: `npm install`, then `npm run dev`. The versions are the
 * ones this site is built and tested with, so the project starts on a known-good set.
 */
export function nextSite(site: BuiltSite): Record<string, string> {
  const { pageFiles, partFiles } = siteSources(site);
  const name = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
  const options = { name: site.name };
  const files: Record<string, string> = {};

  files["package.json"] = `${JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "16.3.5", react: "19.2.8", "react-dom": "19.2.8" },
      devDependencies: {
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        tailwindcss: "^4",
        typescript: "^5",
      },
    },
    null,
    2,
  )}\n`;
  files["tsconfig.json"] = `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "react-jsx",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  )}\n`;
  files["next.config.ts"] = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;
  files["postcss.config.mjs"] = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
  files[".gitignore"] = "node_modules\n.next\nnext-env.d.ts\n*.tsbuildinfo\n";
  files["app/globals.css"] = `@import "tailwindcss";\n`;
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(options.name)},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  Object.assign(files, pageFiles, partFiles);
  files["README.md"] = `# ${options.name}

A website put together from accessible parts on Build Components (https://build-components.devstash.me).

    npm install
    npm run dev

Then open http://localhost:3000.

${site.pages.map((page) => `- \`${pageFile(page.path)}\`: ${page.title} (${page.path})`).join("\n")}
- \`components/\` holds the shared header and footer; \`components/<page>/\` holds each page's own parts.
  Every part has the options you chose already set in its config block (between \`// @config-start\`
  and \`// @config-end\`). Change them there.
- Styling is Tailwind CSS v4. Nothing else is needed at run time.
`;
  return files;
}
