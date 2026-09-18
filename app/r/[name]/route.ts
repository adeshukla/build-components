import { applyConfig } from "@/lib/export";
import { isRegistrySlug, registry } from "@/lib/registry";
import { parseConfig } from "@/lib/schema";
import { readSource } from "@/lib/sources";

// shadcn-compatible registry item: npx shadcn@latest add "<origin>/r/<name>.json?<options>"
export async function GET(request: Request, ctx: RouteContext<"/r/[name]">) {
  const { name } = await ctx.params;
  const slug = name.replace(/\.json$/, "");
  // Only known slugs reach the file system.
  if (!name.endsWith(".json") || !isRegistrySlug(slug)) {
    return new Response("Not found", { status: 404 });
  }

  const item = registry[slug];
  const config = parseConfig(item.schema, new URL(request.url).searchParams);
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: slug,
    type: "registry:component",
    title: item.title,
    description: item.description,
    files: [
      {
        path: `registry/${slug}/react/${slug}.tsx`,
        type: "registry:component",
        content: applyConfig(readSource(`${slug}/react/${slug}.tsx`), config),
      },
    ],
  });
}
