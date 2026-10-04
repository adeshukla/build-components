import { count } from "@/lib/counter";
import { siteRegistryItem } from "@/lib/next-project";
import { decodeSite } from "@/lib/site-builder";

/*
 * A website from the builder as one shadcn registry item (D80, D86):
 * npx shadcn@latest add "<origin>/r/pages/<name>.json?p=<site>". It writes every page at its route
 * (app/page.tsx, app/<page>/page.tsx) and every part at its file, with the site's options already in them.
 */
export async function GET(request: Request, ctx: RouteContext<"/r/pages/[name]">) {
  const { name } = await ctx.params;
  const site = await decodeSite(new URL(request.url).searchParams.get("p") ?? "");
  if (!name.endsWith(".json") || !site) return new Response("Not found", { status: 404 });
  count("install", "built-site");
  return Response.json(siteRegistryItem(site));
}
