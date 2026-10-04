import { llmsTxt } from "@/lib/ai-index";

/** For AI assistants (D91): what the site is, how to install a part, and every part and template. */
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
