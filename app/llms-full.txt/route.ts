import { llmsFullTxt } from "@/lib/ai-index";

/** For AI assistants (D91): every part with every option it takes. */
export function GET() {
  return new Response(llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
