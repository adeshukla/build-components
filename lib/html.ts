/** Escapes text for HTML content and double-quoted attributes in generated markup. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Relative, fragment, http(s), mailto and tel links only; anything else becomes "#". */
export function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Full exported HTML page around a component's markup. */
export function htmlPage({ title, slug, body, script }: { title: string; slug: string; body: string; script: boolean }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${slug}.css">
  </head>
  <body>
${body}${script ? `\n    <script src="${slug}.js"></script>` : ""}
  </body>
</html>
`;
}
