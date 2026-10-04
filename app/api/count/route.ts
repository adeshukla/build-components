import { count } from "@/lib/counter";
import { isRegistrySlug } from "@/lib/registry";
import { templateById } from "@/lib/templates";

/*
 * What is taken in the browser and so never reaches a route of ours (D90): copies, and a template's HTML
 * download. Sent by lib/count-beacon.ts. Only names the site knows are counted.
 */
export async function POST(request: Request) {
  let event: unknown;
  let name: unknown;
  try {
    ({ event, name } = JSON.parse((await request.text()).slice(0, 200)));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (event !== "copy" && event !== "download") return new Response(null, { status: 400 });
  if (typeof name !== "string") return new Response(null, { status: 400 });
  const known = isRegistrySlug(name) || name === "built-site" || (name.startsWith("template:") && templateById(name.slice(9)) !== undefined);
  if (!known) return new Response(null, { status: 400 });
  count(event, name);
  return new Response(null, { status: 204 });
}
