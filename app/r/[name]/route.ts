import { applyConfig } from "@/lib/export";
import { parseConfig } from "@/lib/schema";
import { readSource } from "@/lib/sources";
import { datePickerSchema } from "@/registry/date-picker/schema";

// shadcn-compatible registry item: npx shadcn@latest add "<origin>/r/date-picker.json?format=YYYY-MM-DD"
export async function GET(request: Request, ctx: RouteContext<"/r/[name]">) {
  const { name } = await ctx.params;
  if (name !== "date-picker.json") return new Response("Not found", { status: 404 });

  const config = parseConfig(datePickerSchema, new URL(request.url).searchParams);
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "date-picker",
    type: "registry:component",
    title: "Date picker",
    description: "Accessible date picker (WAI-ARIA dialog + grid) with single or range selection.",
    files: [
      {
        path: "registry/date-picker/react/date-picker.tsx",
        type: "registry:component",
        content: applyConfig(readSource("date-picker/react/date-picker.tsx"), config),
      },
    ],
  });
}
