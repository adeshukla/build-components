import { nextSite, siteHtml } from "@/lib/next-project";
import { decodeSite } from "@/lib/site-builder";
import { zip } from "@/lib/zip";

/*
 * Downloads of a website from the builder (D80, D86), from its link text in `?p=`:
 * - /download/<name>.zip       a Next.js project that runs as it is
 * - /download/<name>.json      the same project's files, for the builder to zip with its pictures (D85)
 * - /download/<name>-html.json every page as an HTML file, linked to one another
 * - /download/<name>.html      the home page as one HTML file
 */
export async function GET(request: Request, ctx: RouteContext<"/download/[file]">) {
  const { file } = await ctx.params;
  const site = await decodeSite(new URL(request.url).searchParams.get("p") ?? "");
  const parts = site ? site.top.length + site.bottom.length + site.pages.reduce((count, page) => count + page.sections.length, 0) : 0;
  if (!site || parts === 0) return new Response("Not found", { status: 404 });
  const name = file.replace(/(-html)?\.(zip|json|html)$/, "").replace(/[^a-z0-9-]/g, "") || "site";

  if (file.endsWith("-html.json")) return Response.json(siteHtml(site));
  if (file.endsWith(".json")) return Response.json(nextSite(site));
  if (file.endsWith(".html")) {
    return new Response(siteHtml(site)["index.html"], {
      headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.html"` },
    });
  }
  if (file.endsWith(".zip")) {
    return new Response(new Uint8Array(zip(nextSite(site))), {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}.zip"` },
    });
  }
  return new Response("Not found", { status: 404 });
}
