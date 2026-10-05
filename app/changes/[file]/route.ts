import { feedHeaders, partFeed } from "@/lib/feed";
import { inStock } from "@/lib/parts";
import { isRegistrySlug } from "@/lib/registry";

// One part's changes as RSS (D100): /changes/<slug>.xml, built with the site.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return inStock.map((part) => ({ file: `${part.slug}.xml` }));
}

export async function GET(_request: Request, ctx: RouteContext<"/changes/[file]">) {
  const { file } = await ctx.params;
  const slug = file.replace(/\.xml$/, "");
  if (!file.endsWith(".xml") || !isRegistrySlug(slug)) return new Response("Not found", { status: 404 });
  return new Response(partFeed(slug), { headers: feedHeaders });
}
