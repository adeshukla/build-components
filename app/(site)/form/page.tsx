import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { formSchema } from "@/registry/form/schema";
import { FormEditor } from "./editor";

export const metadata: Metadata = { title: "Form with validation: configure, test and export" };

export default async function FormPage({ searchParams }: PageProps<"/form">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="form" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <FormEditor initialConfig={parseConfig(formSchema, query)} sources={readComponentSources("form")} />
      </div>
    </main>
  );
}
