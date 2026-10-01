import { decodePage, pageTemplate } from "@/lib/page-builder";
import { readTemplateSources } from "@/lib/sources";
import { partInstallUrls, templateReactSource } from "@/lib/template-output";

/*
 * A page from the builder as a shadcn registry item (D80):
 * npx shadcn@latest add "<origin>/r/pages/<name>.json?p=<page>". Like a template's: it depends on each
 * part, installed by URL with the page's options applied, and adds the page at app/<name>/page.tsx.
 */
export async function GET(request: Request, ctx: RouteContext<"/r/pages/[name]">) {
  const { name } = await ctx.params;
  const url = new URL(request.url);
  const page = decodePage(url.searchParams.get("p") ?? "");
  if (!name.endsWith(".json") || !page || page.sections.length === 0) return new Response("Not found", { status: 404 });

  const { template, options } = pageTemplate(page);
  const { exportNames } = readTemplateSources(page.sections.map((section) => section.slug));
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: template.id,
    type: "registry:block",
    title: `${page.name} page`,
    description: template.summary,
    registryDependencies: partInstallUrls(template, options, url.origin),
    files: [
      {
        path: `app/${template.id}/page.tsx`,
        type: "registry:page",
        target: `app/${template.id}/page.tsx`,
        content: templateReactSource(template, options, exportNames),
      },
    ],
  });
}
