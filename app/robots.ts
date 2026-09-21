import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The preview frame and test harness are not pages anyone should land on.
    rules: { userAgent: "*", allow: "/", disallow: ["/preview/", "/harness/", "/r/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
