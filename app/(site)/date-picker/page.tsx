import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { datePickerSchema } from "@/registry/date-picker/schema";
import { DatePickerEditor } from "./editor";

export const metadata: Metadata = { title: "Date picker: configure, test and export" };

export default async function DatePickerPage({ searchParams }: PageProps<"/date-picker">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="date-picker" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <DatePickerEditor
          initialConfig={parseConfig(datePickerSchema, query)}
          sources={readComponentSources("date-picker")}
        />
      </div>
    </main>
  );
}
