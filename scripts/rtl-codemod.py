"""Right-to-left (D93): left and right become start and end, in every part, in both outputs.

A logical property is its physical twin in a left-to-right page, so nothing moves there; in a right-to-left
page it mirrors. Run from the repo root: python scripts/rtl-codemod.py. Kept as the record of what changed.

Left alone, on purpose:
- centring (left: 50% with a translate of -50%, or Tailwind's left-1/2 with -translate-x-1/2): the middle
  is the middle either way;
- positions a script works out from the page (style.left = ...): measured, not written;
- translate-x and transform: what moves which way is decided part by part (the switch knob, D93).
e2e/rtl.spec.ts then checks every part mirrors, and every part's own spec that nothing moved left to right.
"""
import pathlib
import re

ROOT = pathlib.Path("registry")

# Tailwind classes: a token, with any variants (sm:, hover:) and an optional minus sign.
TOKEN = re.compile(r"(?<![\w$.\-/])((?:[\w-]+:)*)(-?)(ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|float-left|float-right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)(-[\w\[\]\.\(\)/%#,-]+)?(?![\w-])")
SWAP = {
    "ml": "ms", "mr": "me", "pl": "ps", "pr": "pe", "left": "start", "right": "end",
    "text-left": "text-start", "text-right": "text-end", "border-l": "border-s", "border-r": "border-e",
    "rounded-l": "rounded-s", "rounded-r": "rounded-e", "rounded-tl": "rounded-ss", "rounded-tr": "rounded-se",
    "rounded-bl": "rounded-es", "rounded-br": "rounded-ee", "float-left": "float-start", "float-right": "float-end",
    "scroll-ml": "scroll-ms", "scroll-mr": "scroll-me", "scroll-pl": "scroll-ps", "scroll-pr": "scroll-pe",
}
# Only these need a suffix to be a class (left-4, ml-auto); text-left and border-l are whole on their own.
NEEDS_SUFFIX = {"ml", "mr", "pl", "pr", "left", "right", "scroll-ml", "scroll-mr", "scroll-pl", "scroll-pr"}


def tailwind(text: str) -> str:
    def swap(match: re.Match) -> str:
        variants, minus, name, suffix = match.group(1), match.group(2), match.group(3), match.group(4) or ""
        if name in NEEDS_SUFFIX and not suffix:
            return match.group(0)
        return f"{variants}{minus}{SWAP[name]}{suffix}"

    # Only inside strings and template literals, not in code. A class list that also moves along x
    # (centring, the side a panel slides in from) stays physical as a whole: half-logical would split it.
    def in_strings(match: re.Match) -> str:
        if "translate-x" in match.group(0):
            return match.group(0)
        return TOKEN.sub(swap, match.group(0))

    return re.sub(r'"[^"\n]*"|`[^`]*`', in_strings, text)


CSS_SWAP = [
    (r"\bmargin-left(?=\s*:)", "margin-inline-start"),
    (r"\bmargin-right(?=\s*:)", "margin-inline-end"),
    (r"\bpadding-left(?=\s*:)", "padding-inline-start"),
    (r"\bpadding-right(?=\s*:)", "padding-inline-end"),
    (r"\bborder-left(?=[-\s:])", "border-inline-start"),
    (r"\bborder-right(?=[-\s:])", "border-inline-end"),
    (r"\bborder-top-left-radius\b", "border-start-start-radius"),
    (r"\bborder-top-right-radius\b", "border-start-end-radius"),
    (r"\bborder-bottom-left-radius\b", "border-end-start-radius"),
    (r"\bborder-bottom-right-radius\b", "border-end-end-radius"),
    (r"\btext-align:\s*left\b", "text-align: start"),
    (r"\btext-align:\s*right\b", "text-align: end"),
    (r"\bfloat:\s*left\b", "float: inline-start"),
    (r"\bfloat:\s*right\b", "float: inline-end"),
]


def four_values(property_name: str, value: str) -> str | None:
    """`padding: 1 2 3 4` with different sides becomes block and inline pairs; anything else is left."""
    parts = value.split()
    if len(parts) != 4 or parts[1] == parts[3]:
        return None
    top, right, bottom, left = parts
    block = top if top == bottom else f"{top} {bottom}"
    return f"{property_name}-block: {block}; {property_name}-inline: {left} {right}"


def css(text: str, script: bool = False) -> str:
    for pattern, replacement in CSS_SWAP:
        text = re.sub(pattern, replacement, text)

    def block(match: re.Match) -> str:
        body = match.group(0)
        # A rule that also moves along x (centring, an arrow on an edge) stays physical, as the React file does.
        along_x = re.search(r"translateX\(|translate\(\s*-?[1-9]|translate:\s*-?[1-9]", body)
        if not along_x:
            body = re.sub(r"(?<![\w-])left(?=\s*:)", "inset-inline-start", body)
            body = re.sub(r"(?<![\w-])right(?=\s*:)", "inset-inline-end", body)
        body = re.sub(
            r"(?<![\w-])(margin|padding|inset)\s*:\s*([^;{}]+?)\s*(;|(?=}))",
            lambda m: (four_values(m.group(1), m.group(2)) or f"{m.group(1)}: {m.group(2)}") + m.group(3),
            body,
        )
        return body

    # One rule (or one inline style attribute) at a time, so centring is judged with its own declarations.
    # In a renderer (TypeScript), braces are code: only its style attributes are CSS.
    return re.sub(r'style="[^"]*"' if script else r"\{[^{}]*\}|style=\"[^\"]*\"", block, text)


def main() -> None:
    import sys

    # The parts to change, by slug: e2e/rtl.spec.ts says which do not mirror. None given: every part.
    only = sys.argv[1:]

    def pick(paths):
        return [path for path in sorted(paths) if not only or path.parts[1] in only]

    changed = []
    for path in pick(ROOT.glob("*/react/*.tsx")):
        before = path.read_text(encoding="utf-8")
        after = tailwind(before)
        if after != before:
            path.write_text(after, encoding="utf-8")
            changed.append(str(path))
    for path in pick(list(ROOT.glob("*/vanilla/*.css")) + list(ROOT.glob("*/vanilla/render.ts"))):
        before = path.read_text(encoding="utf-8")
        after = css(before, script=path.suffix == ".ts")
        if after != before:
            path.write_text(after, encoding="utf-8")
            changed.append(str(path))
    print(f"{len(changed)} files changed")


if __name__ == "__main__":
    main()
