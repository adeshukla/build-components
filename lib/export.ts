const CONFIG_BLOCK = /^[ \t]*\/\/ @config-start\r?\n([ \t]*)([^=\n]*=\s*)[\s\S]*?\r?\n[ \t]*\/\/ @config-end\r?\n/m;

/**
 * Component source files are real, tested code with one `// @config-start … // @config-end` block.
 * Exporting = swapping that block for the user's config. Same function for every output.
 * Files with no block (e.g. a header's static menu script) are returned unchanged.
 */
export function applyConfig(source: string, config: object) {
  const match = CONFIG_BLOCK.exec(source);
  if (!match) return source;
  const [, indent, declaration] = match;
  // Escape "<" so user text can never close a <script> tag when the JS is inlined.
  const json = JSON.stringify(config, null, 2).replace(/</g, "\\u003c").replace(/\n/g, `\n${indent}`);
  // Function replacer: user text containing "$&" etc. must not be treated as a pattern.
  return source.replace(CONFIG_BLOCK, () => `${indent}${declaration}${json};\n`);
}
