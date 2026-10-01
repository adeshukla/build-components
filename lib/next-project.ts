import { applyConfig } from "@/lib/export";
import { readComponentSources, readTemplateSources } from "@/lib/sources";
import { templateReactSource } from "@/lib/template-output";
import { resolve, type Template, type TemplateOptions } from "@/lib/templates";

/*
 * A page as a Next.js project that runs as it is (D80): `npm install`, then `npm run dev`. The page is
 * app/page.tsx, exactly the page.tsx the other outputs give, and each part is its own file in components/,
 * written with the page's options already in it. Server only: it reads the parts from /registry.
 *
 * The versions are the ones this site is built and tested with, so the project starts on a known-good set.
 */
export function nextProject(template: Template, options: TemplateOptions): Record<string, string> {
  const sections = resolve(template, options);
  const { exportNames } = readTemplateSources(sections.map((section) => section.slug));
  const name = template.id;
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
  files["app/page.tsx"] = templateReactSource(template, options, exportNames);
  for (const section of sections) {
    files[`components/${section.slug}.tsx`] = applyConfig(readComponentSources(section.slug).react, section.config);
  }
  files["README.md"] = `# ${options.name}

A page put together from accessible parts on Build Components (https://build-components.devstash.me).

    npm install
    npm run dev

Then open http://localhost:3000.

- \`app/page.tsx\` arranges the page.
- \`components/\` holds one file per part, with the options you chose already set in its config block
  (between \`// @config-start\` and \`// @config-end\`). Change them there.
- Styling is Tailwind CSS v4. Nothing else is needed at run time.
`;
  return files;
}
