import type { MetadataRoute } from "next";
import { inStock } from "@/lib/parts";
import { templates } from "@/lib/templates";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/parts",
    "/templates",
    "/in-use",
    "/tested",
    "/start",
    "/about",
    "/accessibility",
    ...inStock.map((part) => `/${part.slug}`),
    ...templates.map((template) => `/templates/${template.id}`),
  ];
  return pages.map((page) => ({ url: `${siteUrl}${page}` }));
}
