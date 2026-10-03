import { nextProject } from "@/lib/next-project";
import { decodePage, pageTemplate } from "@/lib/page-builder";
import { readTemplateSources } from "@/lib/sources";
import { templateHtml } from "@/lib/template-output";
import { zip } from "@/lib/zip";

/*
 * Downloads of a page from the builder (D80): /download/<name>.zip?p=<page> is a Next.js project that
 * runs as it is, /download/<name>.html?p=<page> the page as one HTML file, and /download/<name>.json?p=<page>
 * the project's files, for the builder to zip in the browser with the pictures only it has (D85).
 */
export async function GET(request: Request, ctx: RouteContext<"/download/[file]">) {
  const { file } = await ctx.params;
  const page = decodePage(new URL(request.url).searchParams.get("p") ?? "");
  const as = file.endsWith(".zip") ? "zip" : file.endsWith(".html") ? "html" : file.endsWith(".json") ? "json" : null;
  if (!as || !page || page.sections.length === 0) return new Response("Not found", { status: 404 });

  const { template, options } = pageTemplate(page);
  if (as === "html") {
    const { sources } = readTemplateSources(page.sections.map((section) => section.slug));
    return new Response(templateHtml(template, options, sources), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${template.id}.html"`,
      },
    });
  }
  if (as === "json") return Response.json(nextProject(template, options));
  return new Response(new Uint8Array(zip(nextProject(template, options))), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${template.id}.zip"`,
    },
  });
}
