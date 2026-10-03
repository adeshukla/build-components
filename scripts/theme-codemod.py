"""
Connects every part to the site theme (D87): the one-time change that made parts read theme variables.
Kept in the repo as the record of exactly what was changed, and so a part added later can be run through it.

    python scripts/theme-codemod.py --dry   # report only
    python scripts/theme-codemod.py         # write

What it does, in every part, with every value falling back to what the part had, so a part with no theme
around it looks exactly as before:
- React: "follow the system" also obeys a light/dark choice on <html data-bc-scheme>; neutral colours read
  --bc-light-*/--bc-dark-*; corner classes read --bc-radius-* (buttons on the accent: --bc-radius-button).
- CSS: the same for colours and corners, the root font reads --bc-font-body, and each dark-mode block also
  answers <html data-bc-scheme="dark"> and steps aside for data-bc-scheme="light".
- render.ts: inline palettes are themed, and left out for "system" so the stylesheet's dark block can apply.
"""
import glob
import re
import sys

DRY = "--dry" in sys.argv
NEUTRALS = ("surface", "sunk", "text", "muted", "line")
RADII = {"xs": "0.25rem", "sm": "0.375rem", "md": "0.5rem", "lg": "0.75rem", "xl": "1rem", "2xl": "1.5rem"}
# Tailwind's names and sizes -> the theme's
TW = {"": "xs", "sm": "xs", "md": "sm", "lg": "md", "xl": "lg", "2xl": "xl", "3xl": "2xl"}
CSS_RADII = {"0.25rem": "xs", "0.375rem": "sm", "0.5rem": "md", "0.75rem": "lg", "1rem": "xl", "1.5rem": "2xl"}
report = {}


def count(key, n=1):
    report[key] = report.get(key, 0) + n


NEW_DARK_MEDIA = '''// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
};'''


def react(path):
    s = open(path, encoding="utf-8").read()
    original = s
    if "data-bc-scheme" not in s:
        s, n = re.subn(r"const darkMedia = \{.*?\n\};", lambda _: NEW_DARK_MEDIA, s, count=1, flags=re.S)
        count("react darkMedia", n)
    # Neutral colours from the theme, the part's own as the fallback.
    def neutral(m):
        return f'{m.group(1)}: `var(--bc-${{dark ? "dark" : "light"}}-{m.group(2)}, ${{palette.{m.group(2)}}})`,'
    if re.search(r"\bconst dark\b", s):
        s, n = re.subn(r'("--[\w-]+-(%s)"): palette\.\2,' % "|".join(NEUTRALS), neutral, s)
        count("react neutral lines", n)
    # A part's own corner option yields to the theme's corners (iPhone corners stay the iPhone's).
    s, n = re.subn(r'("--[\w-]+-radius"): `\$\{config\.radius\}px`,', r'\1: `var(--bc-radius-md, ${config.radius}px)`,', s)
    count("react radius options", n)
    # Corner classes, outside comments.
    lines = s.split("\n")
    for i, line in enumerate(lines):
        stripped = line.lstrip()
        if stripped.startswith(("//", "*", "/*", "{/*")):
            continue
        def strings(m):
            text = m.group(0)
            button = re.search(r"bg-\(--[\w-]+-accent\)", text) is not None
            def corner(c):
                side, size = c.group(1) or "", c.group(2) or ""
                if size not in TW:
                    return c.group(0)
                name = "button" if button else TW[size]
                fallback = RADII[TW[size]]
                count("react corner classes")
                return f"rounded{side}-[var(--bc-radius-{name},{fallback})]"
            return re.sub(r"(?<![\w-])rounded((?:-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?)(?:-(sm|md|lg|xl|2xl|3xl))?(?![\w\[(-])", corner, text)
        lines[i] = re.sub(r'"[^"\n]*"|`[^`\n]*`', strings, line)
    s = "\n".join(lines)
    if s != original:
        count("react files changed")
        if not DRY:
            open(path, "w", encoding="utf-8").write(s)


def css(path):
    s = open(path, encoding="utf-8").read()
    if "--bc-" in s:
        return
    out = []
    i = 0
    n = len(s)

    def block_end(start):
        depth = 0
        j = start
        while j < n:
            if s.startswith("/*", j):
                j = s.index("*/", j) + 2
                continue
            if s[j] == "{":
                depth += 1
            elif s[j] == "}":
                depth -= 1
                if depth == 0:
                    return j
            j += 1
        raise ValueError("unbalanced")

    def decls(body, dark, button):
        def neutral(m):
            count("css neutral declarations")
            return f"{m.group(1)}: var(--bc-{'dark' if dark else 'light'}-{m.group(2)}, {m.group(3)});"
        # Exactly the part's prefix and one neutral name: --cn-text, not --cn-accent-text or --vid-on-sunk.
        body = re.sub(r"(--[a-z0-9]+-(%s))\s*:\s*([^;{}]+?)\s*;" % "|".join(NEUTRALS), neutral, body)
        def radius(m):
            value = m.group(2).strip()
            if value not in CSS_RADII:
                return m.group(0)
            count("css corner declarations")
            return f"{m.group(1)}: var(--bc-radius-{'button' if button else CSS_RADII[value]}, {value});"
        body = re.sub(r"(border(?:-(?:top|bottom)-(?:left|right))?-radius)\s*:\s*([^;{}]+?)\s*;", radius, body)
        def font(m):
            count("css root fonts")
            return f"font-family: var(--bc-font-body, {m.group(1)});"
        body = re.sub(r"font-family:\s*(system-ui[^;]*?)\s*;", font, body)
        return body

    def rules(text, dark):
        """Transforms the rules in text (no at-rules handled except nested media)."""
        res = []
        k = 0
        while k < len(text):
            o = text.find("{", k)
            if o == -1:
                res.append(text[k:])
                break
            selector = text[k:o]
            depth = 0
            j = o
            while j < len(text):
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            body = text[o + 1 : j]
            sel_dark = dark or "theme-dark" in selector or "--dark" in selector
            button = re.search(r"background(?:-color)?\s*:\s*var\(--[\w-]+-accent\)", body) is not None
            res.append(selector + "{" + decls(body, sel_dark, button) + "}")
            k = j + 1
        return "".join(res)

    def prefix(text, pre):
        """Prefixes every selector in a run of plain rules."""
        def one(m):
            comment_free = m.group(1)
            parts = [p.strip() for p in comment_free.split(",")]
            lead = re.match(r"\s*", comment_free).group(0)
            return lead + ", ".join(f"{pre} {p}" for p in parts if p) + " {"
        return re.sub(r"([^{}]+?)\s*\{", one, text)

    while i < n:
        if s.startswith("/*", i):
            end = s.index("*/", i) + 2
            out.append(s[i:end])
            i = end
            continue
        o = s.find("{", i)
        if o == -1:
            out.append(s[i:])
            break
        head = s[i:o]
        close = block_end(o)
        inner = s[o + 1 : close]
        if re.search(r"@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)", head):
            transformed = rules(inner, True)
            count("css dark blocks")
            plain = re.sub(r"/\*.*?\*/", "", transformed, flags=re.S)
            out.append(head + "{" + prefix(plain, ':root:not([data-bc-scheme="light"])') + "}")
            out.append("\n/* The same, when the page itself is set to dark. */\n" + prefix(plain, ':root[data-bc-scheme="dark"]').strip() + "\n")
        elif head.strip().startswith("@"):
            out.append(head + "{" + rules(inner, False) + "}")
        else:
            out.append(rules(s[i : close + 1], False))
        i = close + 1
    result = "".join(out)
    if result != s:
        count("css files changed")
        if not DRY:
            open(path, "w", encoding="utf-8").write(result)


def render(path):
    s = open(path, encoding="utf-8").read()
    if "themedColour" in s:
        return
    slug = path.split("/")[1] if "/" in path else path.split("\\")[1]
    sheet = glob.glob(f"registry/{slug}/vanilla/*.css")[0]
    css_text = open(sheet, encoding="utf-8").read()
    s, n = re.subn(r"`(--[\w-]+-radius): \$\{config\.radius\}px`", r"`\1: var(--bc-radius-md, ${config.radius}px)`", s)
    count("render radius options", n)
    m = re.search(r"\.\.\.Object\.entries\(palette\)\.map\(\(\[key, value\]\) => `--([\w-]+)-\$\{key\}: \$\{value\}`\)", s)
    if not m:
        # One colour per line: each themed, and left to the stylesheet for "system" when it has defaults.
        def line(lm):
            prefix_, key = lm.group(1), lm.group(2)
            defaults = re.search(r"--%s-%s\s*:" % (re.escape(prefix_), key), css_text) is not None
            count("render colour lines")
            themed = f'`--{prefix_}-{key}: ${{themedColour("{key}", palette.{key}, dark)}}`'
            return f'...(config.theme === "system" ? [] : [{themed}]),' if defaults else themed + ","
        s, n = re.subn(r"`--([\w-]+)-(%s): \$\{palette\.\2\}`," % "|".join(NEUTRALS), line, s)
        if n == 0:
            count("render with no palette to theme")
            if not DRY:
                open(path, "w", encoding="utf-8").write(s)
            return
        s = re.sub(r'import \{([^}]*)\} from "@/lib/html";', lambda im: f'import {{{im.group(1).rstrip()}, themedColour }} from "@/lib/html";', s, count=1)
        if not DRY:
            open(path, "w", encoding="utf-8").write(s)
        return
    prefix = m.group(1)
    # Only leave the palette to the stylesheet for "system" when the stylesheet has light defaults to fall back on.
    has_defaults = re.search(r"--%s-surface\s*:" % re.escape(prefix), css_text) is not None
    replacement = (
        f'...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--{prefix}-${{key}}: ${{themedColour(key, value, dark)}}`))'
        if has_defaults
        else f'...Object.entries(palette).map(([key, value]) => `--{prefix}-${{key}}: ${{themedColour(key, value, dark)}}`)'
    )
    count("render palettes" + ("" if has_defaults else " kept for system (no defaults)"))
    s = s[: m.start()] + replacement + s[m.end() :]
    s = re.sub(r'import \{([^}]*)\} from "@/lib/html";', lambda im: f'import {{{im.group(1).rstrip()}, themedColour }} from "@/lib/html";'.replace(",  ", ", "), s, count=1)
    if "themedColour }" not in s and "themedColour}" not in s:
        s = 'import { themedColour } from "@/lib/html";\n' + s
    if not DRY:
        open(path, "w", encoding="utf-8").write(s)


for f in sorted(glob.glob("registry/*/react/*.tsx")):
    react(f)
for f in sorted(glob.glob("registry/*/vanilla/*.css")):
    css(f)
for f in sorted(glob.glob("registry/*/vanilla/render.ts")):
    render(f)
for k, v in sorted(report.items()):
    print(f"{v:5}  {k}")
