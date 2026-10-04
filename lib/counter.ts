import { after } from "next/server";

/*
 * Counting what people take (D90): installs, downloads and copies, per part or template, so the next thing
 * to build is picked from use rather than guessed. One Redis hash per month (`counts:2026-10`), one field
 * per event and name (`install:date-picker`). Nothing about who: no cookie, no address, no browser.
 *
 * The store is an Upstash Redis database added to the Vercel project, which sets these variables. Without
 * them (on a laptop, in tests) nothing is counted. Read the counts in the Upstash console: HGETALL counts:2026-10.
 * ponytail: anyone can raise a count by asking for a file again and again; fine for spotting what is used.
 */
export type CountedEvent = "install" | "download" | "copy";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/** Counts one event once the response has gone, so nothing waits on the store and a failure is silent. */
export function count(event: CountedEvent, name: string) {
  if (!url || !token) return;
  const field = encodeURIComponent(`${event}:${name}`);
  after(() =>
    fetch(`${url}/hincrby/counts:${new Date().toISOString().slice(0, 7)}/${field}/1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {}),
  );
}
