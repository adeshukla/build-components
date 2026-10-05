import { inStock, partBySlug } from "@/lib/parts";
import type { RegistrySlug } from "@/lib/registry";
import { siteName, siteUrl } from "@/lib/site";
import { changesOf, type VersionedChange } from "@/lib/versions";

/*
 * Change feeds (D100): RSS 2.0 of what changed in the parts (lib/versions.ts), so someone who copied a part
 * hears about its fixes without an account. One feed per part (/changes/<slug>.xml) and one for every part
 * (/changes.xml), where a change made to many parts on one day (the site theme, the Words options) is one
 * item naming them, not one item each.
 */

const xml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** "2026-10-05" as an RSS date: midday UTC, so no reader shows it as the day before. */
const rssDate = (date: string) => new Date(`${date}T12:00:00Z`).toUTCString();
const kindWord = { first: "First released", added: "Added", fixed: "Fixed" } as const;
const noteOf = (change: VersionedChange) => change.note || "The first version.";

type Item = { title: string; link: string; guid: string; date: string; description: string };

function channel(title: string, link: string, self: string, description: string, items: Item[]) {
  const body = items
    .map(
      (item) => `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(item.link)}</link>
      <guid isPermaLink="false">${xml(item.guid)}</guid>
      <pubDate>${rssDate(item.date)}</pubDate>
      <description>${xml(item.description)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(title)}</title>
    <link>${xml(link)}</link>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>
    <description>${xml(description)}</description>
    <language>en</language>
${items[0] ? `    <lastBuildDate>${rssDate(items[0].date)}</lastBuildDate>\n` : ""}${body}
  </channel>
</rss>
`;
}

/** One part's changes, newest first. */
export function partFeed(slug: RegistrySlug) {
  const { name } = partBySlug(slug);
  const items = changesOf(slug).map((change) => ({
    title: `${name} ${change.version}: ${kindWord[change.kind].toLowerCase()}`,
    link: `${siteUrl}/${slug}#changes`,
    guid: `${slug}@${change.version}`,
    date: change.date,
    description: `${kindWord[change.kind]}. ${noteOf(change)}`,
  }));
  return channel(`${name} changes · ${siteName}`, `${siteUrl}/${slug}`, `${siteUrl}/changes/${slug}.xml`, `What changed in the ${name} part, newest first. Each version is stamped on the first line of the files it gives out.`, items);
}

/** Every part's changes, newest first; one change made to many parts on one day is one item. */
export function allFeed() {
  const grouped = new Map<string, { change: VersionedChange; parts: { slug: string; name: string; version: string }[] }>();
  for (const { slug, name } of inStock) {
    for (const change of changesOf(slug as RegistrySlug)) {
      const key = `${change.date}|${change.kind}|${change.note}`;
      const group = grouped.get(key) ?? { change, parts: [] };
      group.parts.push({ slug, name, version: change.version });
      grouped.set(key, group);
    }
  }
  const items = [...grouped.values()]
    .sort((a, b) => b.change.date.localeCompare(a.change.date))
    .map(({ change, parts }) => {
      const one = parts.length === 1 ? parts[0] : null;
      const names = parts.map((part) => `${part.name} ${part.version}`).join(", ");
      return {
        title: one ? `${one.name} ${one.version}: ${kindWord[change.kind].toLowerCase()}` : `${parts.length} parts: ${kindWord[change.kind].toLowerCase()}`,
        link: one ? `${siteUrl}/${one.slug}#changes` : `${siteUrl}/parts`,
        guid: `${change.date}:${change.kind}:${parts.map((part) => `${part.slug}@${part.version}`).join(",")}`,
        date: change.date,
        description: `${kindWord[change.kind]}. ${noteOf(change)}${one ? "" : ` Parts: ${names}.`}`,
      };
    });
  return channel(`Part changes · ${siteName}`, `${siteUrl}/parts`, `${siteUrl}/changes.xml`, "What changed in every part, newest first: fixes, additions and new parts.", items);
}

export const feedHeaders = { "Content-Type": "application/rss+xml; charset=utf-8" };
