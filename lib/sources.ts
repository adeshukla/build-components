import fs from "node:fs";
import path from "node:path";

/** Reads a component source file from /registry. Server/Node only (pages, route handlers, tests). */
export function readSource(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "registry", file), "utf8");
}
