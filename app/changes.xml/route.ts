import { allFeed, feedHeaders } from "@/lib/feed";

// Every part's changes as RSS (D100), built with the site.
export const dynamic = "force-static";

export function GET() {
  return new Response(allFeed(), { headers: feedHeaders });
}
