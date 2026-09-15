import { applyConfig } from "@/lib/export";
import { parseConfig } from "@/lib/schema";
import { readSource } from "@/lib/sources";
import { datePickerSchema } from "@/registry/date-picker/schema";
import { modalSchema } from "@/registry/modal/schema";

const registry = {
  "date-picker": {
    title: "Date picker",
    description: "Accessible date picker (WAI-ARIA dialog + grid) with single or range selection.",
    schema: datePickerSchema,
  },
  modal: {
    title: "Modal",
    description: "Accessible modal dialog (WAI-ARIA dialog pattern) with title, body and actions.",
    schema: modalSchema,
  },
};

// shadcn-compatible registry item: npx shadcn@latest add "<origin>/r/<name>.json?<options>"
export async function GET(request: Request, ctx: RouteContext<"/r/[name]">) {
  const { name } = await ctx.params;
  const slug = name.replace(/\.json$/, "");
  // Only known slugs reach the file system.
  if (!name.endsWith(".json") || !Object.hasOwn(registry, slug)) {
    return new Response("Not found", { status: 404 });
  }

  const item = registry[slug as keyof typeof registry];
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
