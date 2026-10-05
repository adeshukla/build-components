import { applyConfig } from "@/lib/export";
import { regionOf } from "@/lib/page-builder";
import { siteTemplates, type BuiltSite } from "@/lib/site-builder";
import { readComponentSources, readTemplateSources } from "@/lib/sources";
import { templateHtml, templateReactSource, type PageMeta } from "@/lib/template-output";
import { resolve } from "@/lib/templates";
import { themeCss } from "@/lib/theme";

/*
 * What a website from the builder goes out as (D80, D86). Server only: it reads the parts from /registry.
 *
 * Every page is the page.tsx the other outputs give. The shared header and footer are one file each in
 * components/; a page's own parts are in components/<page>/, written with that page's options, so two
 * pages can each have, say, a page header of their own.
 */

const pageFile = (path: string) => (path === "/" ? "app/page.tsx" : `app${path}/page.tsx`);
const htmlFile = (path: string) => (path === "/" ? "index.html" : `${path.slice(1)}.html`);
/** A page's own address on the live site, when the site has one: canonical links and the sitemap (D96). */
const liveUrl = (site: BuiltSite, path: string, file = path) => (site.url ? `${site.url}/${path === "/" ? "" : file.replace(/^\//, "")}` : undefined);
/** What a page tells search engines and link previews. The home page keeps the site's name as its title. */
const metaOf = (site: BuiltSite, page: BuiltSite["pages"][number]): PageMeta => ({
  title: page.path === "/" ? undefined : page.title,
  description: page.description,
  image: page.image,
  url: site.url ? page.path : undefined,
});
const partFile = (pageId: string, slug: string) => (regionOf(slug) === "main" ? `components/${pageId}/${slug}.tsx` : `components/${slug}.tsx`);

/** Each page's file, and each part's file with its options in place. */
/** Each page's file, and each part's file with its options in place. A page imports the theme itself only
 * when no layout of ours does it for it (the shadcn install). */
function siteSources(site: BuiltSite, pagesImportTheme = false, formsTo = "") {
  const pages = siteTemplates(site);
  const { exportNames } = readTemplateSources(pages.flatMap(({ template }) => template.sections.map((section) => section.slug)));
  const pageFiles: Record<string, string> = {};
  const partFiles: Record<string, string> = {};
  for (const { page, template, options } of pages) {
    const themeImport = pagesImportTheme ? (page.path === "/" ? "./bc-theme.css" : "../bc-theme.css") : undefined;
    pageFiles[pageFile(page.path)] = templateReactSource(template, options, exportNames, (slug) => `@/${partFile(page.id, slug).replace(/\.tsx$/, "")}`, themeImport, metaOf(site, page));
    for (const section of resolve(template, options)) {
      // A form with nowhere to send goes to the project's own endpoint, when it has one (D95).
      const sends = formsTo && "action" in section.config && section.config.action === "";
      const config = sends ? { ...section.config, action: formsTo } : section.config;
      partFiles[partFile(page.id, section.slug)] = applyConfig(readComponentSources(section.slug).react, config);
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
  const restore = `<script>try{var s=localStorage.getItem("bc-scheme");if(s==="dark"||s==="light")document.documentElement.dataset.bcScheme=s}catch(e){}</script>`;
  const files: Record<string, string> = Object.fromEntries(
    pages.map(({ page, template, options }) => {
      const meta = { description: page.description, image: page.image, url: liveUrl(site, page.path, htmlFile(page.path)) };
      return [htmlFile(page.path), local(templateHtml(template, options, sources, meta)).replace("</head>", `    ${restore}\n  </head>`)];
    }),
  );
  // With the site's address, search engines get a list of its pages (D96).
  if (site.url) {
    const urls = site.pages.map((page) => `  <url><loc>${liveUrl(site, page.path, htmlFile(page.path))}</loc></url>`);
    files["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
    files["robots.txt"] = `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;
  }
  return files;
}

/** The site as one shadcn registry item: every page at its route, every part at its file. */
export function siteRegistryItem(site: BuiltSite) {
  const { pageFiles, partFiles } = siteSources(site, true);
  const theme = site.look ? [{ path: "app/bc-theme.css", type: "registry:file", target: "app/bc-theme.css", content: themeCss(site.look) }] : [];
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site",
    type: "registry:block",
    title: `${site.name} website`,
    description: `${site.pages.length} ${site.pages.length === 1 ? "page" : "pages"} for ${site.name}, put together from parts.`,
    files: [
      ...Object.entries(pageFiles).map(([path, content]) => ({ path, type: "registry:page", target: path, content })),
      ...Object.entries(partFiles).map(([path, content]) => ({ path, type: "registry:component", target: path, content })),
      ...theme,
    ],
  };
}

/**
 * Where the project's forms send (D95): every form and newsletter whose Send to was left empty posts here.
 * A message goes on to FORM_WEBHOOK_URL as JSON (Slack, Zapier, Make and most automation tools take it),
 * or is written to the server log when that is not set. Without JavaScript the browser posts here too, and
 * is sent back to the page it came from.
 */
const formsRoute = `// Where this site's forms send. Set FORM_WEBHOOK_URL to pass each message on; without it, messages are logged.
const LIMIT = 100_000;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > LIMIT) return Response.json({ ok: false }, { status: 413 });
  const fields: Record<string, string> = {};
  for (const [name, value] of (await request.formData()).entries()) {
    fields[name] = typeof value === "string" ? value.slice(0, 5000) : value.name;
  }

  let ok = true;
  const hook = process.env.FORM_WEBHOOK_URL;
  if (hook) {
    const text = Object.entries(fields).map(([name, value]) => \`\${name}: \${value}\`).join("\\n");
    ok = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, fields }) })
      .then((response) => response.ok)
      .catch(() => false);
  } else {
    console.log("Form message (set FORM_WEBHOOK_URL to send these on):", fields);
  }

  // A form sent without JavaScript goes back to its own page; the site's scripts ask for JSON.
  if (!request.headers.get("accept")?.includes("application/json")) {
    const back = new URL(request.headers.get("referer") ?? "/", request.url);
    return Response.redirect(back.origin === new URL(request.url).origin ? back : new URL("/", request.url), 303);
  }
  return Response.json({ ok }, { status: ok ? 200 : 502 });
}
`;

/**
 * The site as a Next.js project that runs as it is: `npm install`, then `npm run dev`. The versions are the
 * ones this site is built and tested with, so the project starts on a known-good set.
 */
export function nextSite(site: BuiltSite): Record<string, string> {
  const { pageFiles, partFiles } = siteSources(site, false, "/api/forms");
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
  if (site.look) files["app/bc-theme.css"] = themeCss(site.look);
  // A visitor's light/dark choice (the header's switch) is put back before the page paints.
  const restore = `try{var s=localStorage.getItem("bc-scheme");if(s==="dark"||s==="light")document.documentElement.dataset.bcScheme=s}catch(e){}`;
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import "./globals.css";${site.look ? '\nimport "./bc-theme.css";' : ""}

export const metadata: Metadata = {${site.url ? `\n  metadataBase: new URL(${JSON.stringify(site.url)}),` : ""}
  title: { default: ${JSON.stringify(options.name)}, template: ${JSON.stringify(`%s | ${options.name}`)} },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ${JSON.stringify(restore)} }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
  Object.assign(files, pageFiles, partFiles);
  files["app/api/forms/route.ts"] = formsRoute;
  // With the site's address, search engines get a list of its pages and leave to crawl them (D96).
  if (site.url) {
    files["app/sitemap.ts"] = `import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ${JSON.stringify(site.pages.map((page) => liveUrl(site, page.path)))}.map((url) => ({ url }));
}
`;
    files["app/robots.ts"] = `import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: ${JSON.stringify(`${site.url}/sitemap.xml`)} };
}
`;
  }
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

## Forms

Every form on the site sends to \`app/api/forms/route.ts\` unless you gave it an address of its own. Set
\`FORM_WEBHOOK_URL\` to where messages should go (a Slack incoming webhook, a Zapier or Make hook, or your own
endpoint): each one arrives as JSON with the form's fields. Until it is set, messages are written to the server
log.

## Search engines and link previews

${site.url ? `\`app/sitemap.ts\` lists every page at ${site.url}, and \`app/robots.ts\` points search engines to it.` : "Set the site's address in the builder (Website, Site address) to get a sitemap and robots file."}
Each page's title, description and share picture are in the \`metadata\` at the top of its \`page.tsx\`.

## Putting it online

The project is a standard Next.js app, so any host that runs Next.js takes it as it is. Two that need no setup:

- **Vercel:** \`npx vercel\` in this folder, then \`npx vercel --prod\` when you are happy. Add
  \`FORM_WEBHOOK_URL\` under the project's Environment Variables.
- **Netlify:** \`npx netlify deploy --build\`, then \`--prod\` to go live. Add \`FORM_WEBHOOK_URL\` under Site
  configuration, Environment variables.

Both ask you to sign in the first time, and give you an address to share straight away.
`;
  return files;
}
