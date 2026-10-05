/*
 * Websites kept for deploying (D99): a site's link text under a short id, so a Vercel deploy can fetch its
 * files from /download/<name>.json?s=<id> for as long as the deployed project builds. The id is the start of
 * the text's SHA-256, so the same site is kept once. Kept in the same Upstash Redis as the counter (D90);
 * without it, nothing is kept and the deploy carries the link itself when it is short enough.
 * ponytail: nothing is ever deleted; at a few kilobytes a site, the free plan's 256 MB holds tens of thousands.
 */
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const canKeepSites = Boolean(url && token);

/** One Redis command through Upstash's REST API: the command as a JSON array, posted to the base URL. */
const command = (parts: string[]) =>
  fetch(url!, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(parts) }).catch(() => null);

/** Keeps a site's link text and gives back its id, or null when there is no store or it fails. */
export async function keepSite(text: string) {
  if (!url || !token) return null;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  const id = [...digest.slice(0, 8)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const response = await command(["SET", `site:${id}`, text]);
  return response?.ok ? id : null;
}

/** A kept site's link text, or "" when there is none. */
export async function keptSite(id: string) {
  if (!url || !token || !/^[0-9a-f]{16}$/.test(id)) return "";
  const response = await command(["GET", `site:${id}`]);
  const data = response?.ok ? ((await response.json()) as { result?: unknown }) : null;
  return typeof data?.result === "string" ? data.result : "";
}
