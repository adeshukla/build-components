#!/usr/bin/env python3
"""Wires new registry components into the five files that have to know about them.

Usage: python scratchpad/wire.py batch.json

batch.json is a list of entries:
  { "slug": "date-range", "camel": "dateRange", "export": "DateRange",
    "name": "Date range", "title": "Date range", "category": "Inputs",
    "summary": "...", "pattern": "...", "accent": "#aabbcc",
    "description": "...", "how": "...", "steps": [...],
    "variants": { "default": "", "other": "theme=dark" },
    "js": true }
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def patch(rel, fn):
    path = ROOT / rel
    text = path.read_text(encoding="utf8")
    out = fn(text)
    if out != text:
        for _ in range(5):  # OneDrive occasionally refuses a write; try again.
            try:
                path.write_text(out, encoding="utf8")
                break
            except OSError as err:
                print(f"  retrying {rel}: {err}")
        print(f"  patched {rel}")


def wire(entries):
    # 1. lib/parts.ts
    def parts(text):
        block = ""
        for e in entries:
            if f'slug: "{e["slug"]}"' in text:
                continue
            block += (
                "  {\n"
                f'    slug: "{e["slug"]}",\n'
                f'    category: "{e["category"]}",\n'
                f'    name: "{e["name"]}",\n'
                f'    summary: "{e["summary"]}",\n'
                f'    pattern: "{e["pattern"]}",\n'
                f'    accent: "{e["accent"]}",\n'
                '    status: "in-stock",\n'
                "  },\n"
            )
        return text.replace("];\n\n/** Parts that span", block + "];\n\n/** Parts that span", 1)

    patch("lib/parts.ts", parts)

    # 2. lib/registry.ts
    def registry(text):
        imports = ""
        map_entries = ""
        for e in entries:
            if f'"{e["slug"]}": {{' in text:
                continue
            imports += (
                f'import {{ {e["camel"]}Schema }} from "@/registry/{e["slug"]}/schema";\n'
                f'import * as {e["camel"]}Docs from "@/registry/{e["slug"]}/docs";\n'
                f'import {{ render{e["export"]}Html }} from "@/registry/{e["slug"]}/vanilla/render";\n'
            )
            map_entries += (
                f'  "{e["slug"]}": {{\n'
                f'    title: "{e["title"]}",\n'
                f'    description: "{e["description"]}",\n'
                f'    schema: {e["camel"]}Schema,\n'
                f'    ...{e["camel"]}Docs,\n'
                f'    renderHtml: (config) => render{e["export"]}Html(config as never),\n'
                "  },\n"
            )
        text = text.replace(
            'import { parseConfig, type Schema } from "@/lib/schema";',
            imports + 'import { parseConfig, type Schema } from "@/lib/schema";',
            1,
        ) if 'import { parseConfig, type Schema } from "@/lib/schema";' in text else text.replace(
            '\nexport type RegistryEntry', "\n" + imports + "\nexport type RegistryEntry", 1
        )
        return text.replace(
            "} satisfies Record<string, RegistryEntry>;", map_entries + "} satisfies Record<string, RegistryEntry>;", 1
        )

    patch("lib/registry.ts", registry)

    # 3. components/preview-client.tsx
    def preview(text):
        imports = ""
        lines = ""
        for e in entries:
            if f'slug === "{e["slug"]}"' in text:
                continue
            imports += (
                f'import {{ {e["export"]}, type {e["export"]}Config }} '
                f'from "@/registry/{e["slug"]}/react/{e["slug"]}";\n'
            )
            lines += (
                f'        {{slug === "{e["slug"]}" && '
                f'<{e["export"]} config={{config as unknown as {e["export"]}Config}} />}}\n'
            )
        anchor = '        {slug === "date-picker" && <DatePicker'
        text = text.replace(
            'import { Carousel, type CarouselConfig }', imports + "import { Carousel, type CarouselConfig }", 1
        )
        return text.replace(anchor, lines + anchor, 1)

    patch("components/preview-client.tsx", preview)

    # 4. e2e/generate.ts
    def generate(text):
        imports = ""
        map_entries = ""
        for e in entries:
            if f'"{e["slug"]}": {{' in text:
                continue
            imports += (
                f'import {{ {e["camel"]}Schema }} from "../registry/{e["slug"]}/schema";\n'
                f'import type {{ {e["export"]}Config }} from "../registry/{e["slug"]}/react/{e["slug"]}";\n'
                f'import {{ render{e["export"]}Html }} from "../registry/{e["slug"]}/vanilla/render";\n'
            )
            variants = "".join(f'      {k}: "{v}",\n' for k, v in e["variants"].items())
            map_entries += (
                f'  "{e["slug"]}": {{\n'
                f'    exportName: "{e["export"]}",\n'
                f'    schema: {e["camel"]}Schema,\n'
                f'    renderHtml: (config) => render{e["export"]}Html(config as unknown as {e["export"]}Config),\n'
                "    variants: {\n" + variants + "    },\n"
                "  },\n"
            )
        text = text.replace(
            'import { parseConfig, type Schema } from "../lib/schema";',
            imports + 'import { parseConfig, type Schema } from "../lib/schema";',
            1,
        )
        # The components map ends at the line `};` before `function harnessPage` or similar.
        marker = re.search(r"\n\};\n\nconst harnessPage|\n\};\n\nfunction harnessPage", text)
        if marker is None:
            raise SystemExit("could not find the end of the components map in e2e/generate.ts")
        at = marker.start() + 1
        return text[:at] + map_entries + text[at:]

    patch("e2e/generate.ts", generate)

    # 5. lib/demos.ts
    def demos(text):
        block = ""
        for e in entries:
            if f'"{e["slug"]}": {{' in text:
                continue
            steps = ""
            if e.get("steps"):
                steps = "    steps: [\n" + "".join(
                    f'      {{ find: "{s["find"]}", action: "{s["action"]}"'
                    + (f', value: "{s["value"]}"' if "value" in s else "")
                    + (f', after: {s["after"]}' if "after" in s else "")
                    + " },\n"
                    for s in e["steps"]
                ) + "    ],\n"
            block += f'  "{e["slug"]}": {{\n    how: "{e["how"]}",\n' + steps + "  },\n"
        return text.rstrip()[: -len("};")].rstrip("\n") + "\n" + block + "};\n"

    patch("lib/demos.ts", demos)


if __name__ == "__main__":
    wire(json.loads(Path(sys.argv[1]).read_text(encoding="utf8")))
    print("done")
