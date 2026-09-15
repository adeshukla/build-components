import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { modalSchema } from "@/registry/modal/schema";
import { ModalEditor } from "./editor";

export const metadata: Metadata = { title: "Modal: configure, test and export" };

export default async function ModalPage({ searchParams }: PageProps<"/modal">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="modal" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <ModalEditor initialConfig={parseConfig(modalSchema, query)} sources={readComponentSources("modal")} />
      </div>
    </main>
  );
}
