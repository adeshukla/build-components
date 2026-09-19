import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { carouselSchema } from "@/registry/carousel/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { CarouselEditor } from "./editor";

export const metadata: Metadata = { title: "Carousel: configure, test and export" };

export default async function CarouselPage({ searchParams }: PageProps<"/carousel">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="carousel" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <CarouselEditor initialConfig={parseConfig(carouselSchema, query)} sources={readComponentSources("carousel")} />
      </div>
    </main>
  );
}
