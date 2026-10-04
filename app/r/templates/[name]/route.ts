import { count } from "@/lib/counter";
import { readTemplateSources } from "@/lib/sources";
import { partInstallUrls, templateReactSource } from "@/lib/template-output";
import { optionsFromParams, templateById } from "@/lib/templates";

/*
 * A template as a shadcn registry item: npx shadcn@latest add "<origin>/r/templates/<id>.json?<options>".
 * It depends on each of its parts, installed by URL with the options already applied, and adds the page
 * that arranges them at app/<id>/page.tsx.
 */
export async function GET(request: Request, ctx: RouteContext<"/r/templates/[name]">) {
  const { name } = await ctx.params;
  const template = name.endsWith(".json") ? templateById(name.replace(/\.json$/, "")) : undefined;
  if (!template) return new Response("Not found", { status: 404 });

  count("install", `template:${template.id}`);
  const url = new URL(request.url);
  const options = optionsFromParams(template, url.searchParams);
  const { exportNames } = readTemplateSources(template.sections.map((section) => section.slug));
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: template.id,
    type: "registry:block",
    title: `${template.name} template`,
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
