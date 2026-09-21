import type { MetadataRoute } from "next";
import { inStock } from "@/lib/parts";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/accessibility", ...inStock.map((part) => `/${part.slug}`)];
  return pages.map((page) => ({ url: `${siteUrl}${page}` }));
}
