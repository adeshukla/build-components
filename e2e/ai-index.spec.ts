import { expect, test } from "@playwright/test";
import { inStock } from "../lib/parts";
import { isRegistrySlug, registry } from "../lib/registry";
import { templates } from "../lib/templates";

/*
 * What tools read (D91): the registry index the shadcn CLI and its MCP server search under a namespace, and
 * the llms.txt files. Checked once with the real CLI: `shadcn view` and `shadcn search` against a
 * components.json with "@build-components" pointing at this server.
 */

const slugs = inStock.map((part) => part.slug).filter(isRegistrySlug);

test("the registry index lists every part, as the shadcn schema describes", async ({ request }) => {
  const index = await (await request.get("/r/registry.json")).json();
  expect(index.$schema).toBe("https://ui.shadcn.com/schema/registry.json");
  expect(index.items.map((item: { name: string }) => item.name).sort()).toEqual([...slugs].sort());
  for (const item of index.items) {
    expect(item.type).toBe("registry:component");
    expect(item.meta.version).toMatch(/^1\.\d+\.\d+$/);
  }
});

test("llms.txt names every part and template with its install address", async ({ request }) => {
  const text = await (await request.get("/llms.txt")).text();
  for (const slug of slugs) expect(text).toContain(`/r/${slug}.json`);
  for (const template of templates) expect(text).toContain(`/r/templates/${template.id}.json`);
  expect(text).toContain('"@build-components"');
});

test("llms-full.txt gives every option of every part", async ({ request }) => {
  const text = await (await request.get("/llms-full.txt")).text();
  for (const slug of slugs) {
    expect(text).toContain(`(${slug}, `);
    for (const option of registry[slug].schema) expect(text, `${slug}.${option.key}`).toContain(`\`${option.key}\``);
  }
  expect(text).toContain("- `mode`: one of single, range. Default \"single\".");
});
