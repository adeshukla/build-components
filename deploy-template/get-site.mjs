// Fetches this website's files from Build Components before every build (D99 in the Build Components
// project). SITE_FILES_URL was filled in by the Deploy button; it is the address of the site's files.
import fs from "node:fs";
import path from "node:path";

const source = process.env.SITE_FILES_URL;
if (!source) {
  console.error("SITE_FILES_URL is not set. Deploy from the builder at https://build-components.devstash.me/build, or set it in the project's Environment Variables.");
  process.exit(1);
}
const response = await fetch(source);
if (!response.ok) {
  console.error(`Could not fetch the website's files (${response.status}) from ${source}`);
  process.exit(1);
}
const files = await response.json();
const root = process.cwd();
let written = 0;
for (const [file, content] of Object.entries(files)) {
  // The packages are already installed, from this repository's own package.json.
  if (file === "package.json") continue;
  const target = path.resolve(root, file);
  if (!target.startsWith(root + path.sep)) throw new Error(`Refusing to write outside the project: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  written++;
}
console.log(`Wrote ${written} files from Build Components.`);
