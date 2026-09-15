import type { Metadata } from "next";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { modalSchema } from "@/registry/modal/schema";
import { ModalEditor } from "./editor";

export const metadata: Metadata = { title: "Modal" };

export default async function ModalPage({ searchParams }: PageProps<"/modal">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Modal</h1>
      <p className="mb-8 text-neutral-700">
        WAI-ARIA modal dialog pattern. Configure it, test it, then copy the code or install it by URL.
      </p>
      <ModalEditor initialConfig={parseConfig(modalSchema, query)} sources={readComponentSources("modal")} />
    </main>
  );
}
