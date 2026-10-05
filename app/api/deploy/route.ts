import { count } from "@/lib/counter";
import { decodeSite } from "@/lib/site-builder";
import { keepSite } from "@/lib/site-store";
import { deployTemplate, siteUrl } from "@/lib/site";

/*
 * One-click deploy (D99). The builder posts a website's link text; this keeps it (lib/site-store.ts) and
 * answers with Vercel's Deploy Button address for the template repository, with the address of the site's
 * files already filled in as SITE_FILES_URL. The template's build fetches those files, so the person signs in
 * to Vercel, presses Deploy, and has the site. Without a store, a short link travels in the address itself.
 */
const INLINE_LIMIT = 6000;

export async function POST(request: Request) {
  if (!deployTemplate) return Response.json({ error: "One-click deploy is not set up on this site." }, { status: 404 });
  const text = (await request.text()).trim();
  const site = text.length <= 60_000 ? await decodeSite(text) : null;
  const parts = site ? site.top.length + site.bottom.length + site.pages.reduce((total, page) => total + page.sections.length, 0) : 0;
  if (!site || parts === 0) return Response.json({ error: "That is not a website from the builder." }, { status: 400 });

  const name = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "site";
  const id = await keepSite(text);
  if (!id && text.length > INLINE_LIMIT) {
    return Response.json({ error: "This website is too big to send without the site's store. Download the project instead." }, { status: 503 });
  }
  const files = `${siteUrl}/download/${name}.json?${id ? `s=${id}` : `p=${text}`}`;
  const clone = new URL("https://vercel.com/new/clone");
  clone.searchParams.set("repository-url", deployTemplate);
  clone.searchParams.set("project-name", name);
  clone.searchParams.set("repository-name", name);
  clone.searchParams.set("env", "SITE_FILES_URL");
  clone.searchParams.set("envDefaults", JSON.stringify({ SITE_FILES_URL: files }));
  clone.searchParams.set("envDescription", "Where your website's files come from. Leave it as it is.");
  count("download", "built-site:deploy");
  return Response.json({ url: clone.href });
}
