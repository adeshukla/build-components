import { generateFrameworkOutputs } from "./frameworks";
import { frameworkParts } from "./helpers";

/** Once, before any worker starts: every framework page that is out of date (D92). */
export default async function globalSetup() {
  await generateFrameworkOutputs(frameworkParts());
}
